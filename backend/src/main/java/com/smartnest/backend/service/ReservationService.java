package com.smartnest.backend.service;

import com.smartnest.backend.dto.AddPaymentRequest;
import com.smartnest.backend.dto.CreateReservationRequest;
import com.smartnest.backend.dto.UpdateReservationRequest;
import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.AvailabilityStatus;
import com.smartnest.backend.model.Customer;
import com.smartnest.backend.model.ListingStatus;
import com.smartnest.backend.model.OperationalManager;
import com.smartnest.backend.model.PaymentRecord;
import com.smartnest.backend.model.Reservation;
import com.smartnest.backend.model.ReservationStatus;
import com.smartnest.backend.repository.ApartmentRepository;
import com.smartnest.backend.repository.CustomerRepository;
import com.smartnest.backend.repository.OperationalManagerRepository;
import com.smartnest.backend.repository.PaymentRecordRepository;
import com.smartnest.backend.repository.ReservationRepository;
import com.smartnest.backend.event.ReservationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final CustomerRepository customerRepository;
    private final ApartmentRepository apartmentRepository;
    private final OperationalManagerRepository operationalManagerRepository;
    private final ApplicationEventPublisher events; // Observer pattern: we only publish events

    private static final long MAX_PROOF_BYTES = 5L * 1024 * 1024;
    private static final byte[] PDF_MAGIC = {'%', 'P', 'D', 'F'};

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Transactional
    public Reservation createReservation(Long customerId, CreateReservationRequest request) {
        if (request.getInitialPaymentAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Initial payment amount must be greater than 0");
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found: " + request.getApartmentId()));

        if (apartment.getListingStatus() != ListingStatus.APPROVED) {
            throw new IllegalArgumentException("This apartment is not available for reservation");
        }
        if (apartment.getAvailabilityStatus() != AvailabilityStatus.AVAILABLE) {
            throw new IllegalArgumentException("This apartment is no longer available — it may already be reserved or sold");
        }

        Reservation reservation = new Reservation();
        reservation.setCustomer(customer);
        reservation.setApartment(apartment);
        reservation.setStatus(ReservationStatus.PENDING);
        reservation.setPaymentVerified(false);
        Reservation saved = reservationRepository.save(reservation);

        PaymentRecord payment = new PaymentRecord();
        payment.setReservation(saved);
        payment.setAmount(request.getInitialPaymentAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        paymentRecordRepository.save(payment);

        events.publishEvent(new ReservationEvent(ReservationEvent.Action.SUBMITTED, saved));
        return enrich(saved);
    }

    @Transactional
    public Reservation addPayment(Long reservationId, Long callerId, boolean isAdmin, AddPaymentRequest request) {
        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }
        Reservation reservation = getReservation(reservationId);
        if (!isAdmin && !reservation.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only add payments to your own reservation");
        }
        if (reservation.getStatus() == ReservationStatus.REJECTED || reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot add a payment to a rejected or cancelled reservation");
        }

        PaymentRecord payment = new PaymentRecord();
        payment.setReservation(reservation);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        paymentRecordRepository.save(payment);

        return enrich(reservation);
    }

    @Transactional
    public Reservation approveReservation(Long reservationId, Long operationsManagerId, boolean isAdmin) {
        Reservation reservation = getReservation(reservationId);
        OperationalManager manager = isAdmin ? null : operationalManagerRepository.findById(operationsManagerId)
                .orElseThrow(() -> new IllegalArgumentException("Operations manager not found: " + operationsManagerId));

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalArgumentException("Only a pending reservation can be approved");
        }

        BigDecimal totalPaid = sumPayments(reservationId);
        if (totalPaid.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Cannot approve a reservation with no advance payment on record");
        }
        if (advancePayment(reservationId).getProofFilePath() == null) {
            throw new IllegalArgumentException("Cannot approve until the customer uploads the payment transfer proof (PDF)");
        }

        Apartment apartment = reservation.getApartment();
        if (apartment.getAvailabilityStatus() != AvailabilityStatus.AVAILABLE) {
            throw new IllegalArgumentException("This apartment is no longer available to reserve");
        }
        apartment.setAvailabilityStatus(AvailabilityStatus.RESERVED);
        apartmentRepository.save(apartment);

        reservation.setPaymentVerified(true);
        reservation.setStatus(ReservationStatus.APPROVED);
        reservation.setOperationsManager(manager);
        Reservation saved = reservationRepository.save(reservation);

        events.publishEvent(new ReservationEvent(ReservationEvent.Action.APPROVED, saved));
        return enrich(saved);
    }

    @Transactional
    public Reservation rejectReservation(Long reservationId, Long operationsManagerId, String reason, boolean isAdmin) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required");
        }
        Reservation reservation = getReservation(reservationId);
        OperationalManager manager = isAdmin ? null : operationalManagerRepository.findById(operationsManagerId)
                .orElseThrow(() -> new IllegalArgumentException("Operations manager not found: " + operationsManagerId));

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalArgumentException("Only a pending reservation can be rejected");
        }

        reservation.setStatus(ReservationStatus.REJECTED);
        reservation.setOperationsManager(manager);
        reservation.setRejectionReason(reason);
        Reservation saved = reservationRepository.save(reservation);

        events.publishEvent(new ReservationEvent(ReservationEvent.Action.REJECTED, saved));
        return enrich(saved);
    }

    @Transactional
    public Reservation cancelReservation(Long reservationId, Long customerId) {
        Reservation reservation = getReservation(reservationId);
        if (!reservation.getCustomer().getUserId().equals(customerId)) {
            throw new AccessDeniedException("You can only cancel your own reservation");
        }
        if (reservation.getStatus() == ReservationStatus.REJECTED || reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw new IllegalArgumentException("This reservation can no longer be cancelled");
        }

        if (reservation.getStatus() == ReservationStatus.APPROVED) {
            Apartment apartment = reservation.getApartment();
            if (apartment.getAvailabilityStatus() == AvailabilityStatus.RESERVED) {
                apartment.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
                apartmentRepository.save(apartment);
            }
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        Reservation saved = reservationRepository.save(reservation);
        events.publishEvent(new ReservationEvent(ReservationEvent.Action.CANCELLED, saved));
        return enrich(saved);
    }

    @Transactional
    public Reservation updateReservation(Long reservationId, Long callerId, boolean isAdmin, UpdateReservationRequest req) {
        if (req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }
        Reservation reservation = getReservation(reservationId);
        if (!isAdmin && !reservation.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only edit your own reservations");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalArgumentException("Only a pending reservation can be edited");
        }

        if (req.getApartmentId() != null && !req.getApartmentId().equals(reservation.getApartmentId())) {
            Apartment apartment = apartmentRepository.findById(req.getApartmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Apartment not found: " + req.getApartmentId()));
            if (apartment.getListingStatus() != ListingStatus.APPROVED) {
                throw new IllegalArgumentException("This apartment is not available for reservation");
            }
            if (apartment.getAvailabilityStatus() != AvailabilityStatus.AVAILABLE) {
                throw new IllegalArgumentException("This apartment is no longer available — it may already be reserved or sold");
            }
            reservation.setApartment(apartment);
            reservationRepository.save(reservation);
        }

        PaymentRecord advancePayment = advancePayment(reservationId);
        advancePayment.setAmount(req.getAmount());
        advancePayment.setPaymentMethod(req.getPaymentMethod());
        paymentRecordRepository.save(advancePayment);

        events.publishEvent(new ReservationEvent(ReservationEvent.Action.CHANGED, reservation));
        return enrich(reservation);
    }

    @Transactional
    public void deleteReservation(Long reservationId, Long callerId, boolean isAdmin) {
        Reservation reservation = getReservation(reservationId);
        if (!isAdmin && !reservation.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only delete your own reservations");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalArgumentException("Only a pending reservation can be deleted");
        }
        List<PaymentRecord> payments = paymentRecordRepository.findByReservationReservationId(reservationId);
        payments.forEach(p -> deleteStoredFile(p.getProofFilePath()));
        paymentRecordRepository.deleteAll(payments);
        reservationRepository.delete(reservation);
    }

    /** Attaches (or replaces) the bank-transfer PDF for the reservation's advance payment. */
    @Transactional
    public Reservation attachPaymentProof(Long reservationId, Long callerId, boolean isAdmin, MultipartFile file) {
        Reservation reservation = getReservation(reservationId);
        if (!isAdmin && !reservation.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only upload proof for your own reservation");
        }
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalArgumentException("Payment proof can only be changed while the reservation is pending");
        }
        validatePdf(file);

        PaymentRecord advance = advancePayment(reservationId);
        String relative = "payment-proofs/" + reservationId + "/" + UUID.randomUUID() + ".pdf";
        Path target = uploadRoot().resolve(relative);
        try {
            Files.createDirectories(target.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not save the payment proof", e);
        }

        deleteStoredFile(advance.getProofFilePath());
        advance.setProofFilePath(relative);
        advance.setProofFileName(cleanFileName(file.getOriginalFilename()));
        paymentRecordRepository.save(advance);
        events.publishEvent(new ReservationEvent(ReservationEvent.Action.PROOF_UPLOADED, reservation));
        return enrich(reservation);
    }

    /** The stored PDF for a reservation, for the owning customer or an Operations Manager / Admin. */
    @Transactional(readOnly = true)
    public PaymentProof getPaymentProof(Long reservationId, Long callerId, boolean isStaffReviewer) {
        Reservation reservation = getReservation(reservationId);
        if (!isStaffReviewer && !reservation.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only view proof for your own reservation");
        }
        PaymentRecord advance = advancePayment(reservationId);
        if (advance.getProofFilePath() == null) {
            throw new IllegalArgumentException("No payment proof has been uploaded for this reservation");
        }
        Path file = uploadRoot().resolve(advance.getProofFilePath());
        if (!Files.isReadable(file)) {
            throw new IllegalArgumentException("The payment proof file is missing on the server — ask the customer to upload it again");
        }
        return new PaymentProof(new PathResource(file), advance.getProofFileName());
    }

    public record PaymentProof(Resource file, String fileName) {}

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please attach your payment transfer slip as a PDF");
        }
        if (file.getSize() > MAX_PROOF_BYTES) {
            throw new IllegalArgumentException("The payment proof must be 5 MB or smaller");
        }
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        byte[] head = new byte[PDF_MAGIC.length];
        try (InputStream in = file.getInputStream()) {
            if (!name.endsWith(".pdf") || in.readNBytes(head, 0, head.length) != head.length || !Arrays.equals(head, PDF_MAGIC)) {
                throw new IllegalArgumentException("The payment proof must be a PDF file");
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read the uploaded file", e);
        }
    }

    private static String cleanFileName(String original) {
        String name = original == null ? "" : Path.of(original).getFileName().toString();
        name = name.replaceAll("[^A-Za-z0-9._ -]", "_");
        return name.isBlank() ? "payment-proof.pdf" : name;
    }

    /** backend/uploads, whether the app is started from the backend folder or the project root (IntelliJ). */
    private Path uploadRoot() {
        Path dir = Path.of(uploadDir);
        if (!dir.isAbsolute() && Files.isDirectory(Path.of("backend", "src"))) dir = Path.of("backend").resolve(dir);
        return dir.toAbsolutePath().normalize();
    }

    private void deleteStoredFile(String relativePath) {
        if (relativePath == null) return;
        try {
            Files.deleteIfExists(uploadRoot().resolve(relativePath));
        } catch (IOException ignored) {
            // A leftover file is harmless; the database row no longer points at it.
        }
    }

    private PaymentRecord advancePayment(Long reservationId) {
        return paymentRecordRepository.findByReservationReservationId(reservationId).stream()
                .min(Comparator.comparing(PaymentRecord::getPaymentNo))
                .orElseThrow(() -> new IllegalStateException("Reservation has no advance payment on record"));
    }

    @Transactional(readOnly = true)
    public List<Reservation> getCustomerReservations(Long customerId) {
        return enrich(reservationRepository.findByCustomerUserIdOrderByReservationDateDesc(customerId));
    }

    @Transactional(readOnly = true)
    public List<Reservation> getPendingReservations() {
        return enrich(reservationRepository.findByStatusOrderByReservationDateAsc(ReservationStatus.PENDING));
    }

    @Transactional(readOnly = true)
    public List<Reservation> getAllReservations() {
        return enrich(reservationRepository.findAllByOrderByReservationDateDesc());
    }

    @Transactional(readOnly = true)
    public List<PaymentRecord> getPayments(Long reservationId, Long callerId, boolean isAdmin) {
        Reservation reservation = getReservation(reservationId);
        if (!isAdmin && !reservation.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only view payments on your own reservation");
        }
        return paymentRecordRepository.findByReservationReservationId(reservationId);
    }

    private Reservation getReservation(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found: " + id));
    }

    private BigDecimal sumPayments(Long reservationId) {
        return paymentRecordRepository.findByReservationReservationId(reservationId).stream()
                .map(PaymentRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Reservation enrich(Reservation reservation) {
        return enrich(List.of(reservation)).get(0);
    }

    private List<Reservation> enrich(List<Reservation> reservations) {
        List<Long> ids = reservations.stream().map(Reservation::getReservationId).toList();
        List<PaymentRecord> payments = paymentRecordRepository.findByReservationReservationIdIn(ids);
        Map<Long, BigDecimal> totalsByReservation = payments.stream()
                .collect(Collectors.groupingBy(PaymentRecord::getReservationId,
                        Collectors.reducing(BigDecimal.ZERO, PaymentRecord::getAmount, BigDecimal::add)));
        Map<Long, PaymentRecord> advanceByReservation = payments.stream()
                .collect(Collectors.toMap(PaymentRecord::getReservationId, Function.identity(),
                        (a, b) -> a.getPaymentNo() <= b.getPaymentNo() ? a : b));

        for (Reservation r : reservations) {
            Customer c = r.getCustomer();
            r.setCustomerName(c == null ? null : (c.getFirstName() + " " + c.getLastName()).trim());
            Apartment a = r.getApartment();
            r.setApartmentTitle(a == null ? null : a.getTitle());
            OperationalManager om = r.getOperationsManager();
            r.setOperationsManagerName(om == null ? null : (om.getFirstName() + " " + om.getLastName()).trim());
            r.setTotalPaidAmount(totalsByReservation.getOrDefault(r.getReservationId(), BigDecimal.ZERO));
            PaymentRecord advance = advanceByReservation.get(r.getReservationId());
            r.setHasPaymentProof(advance != null && advance.getProofFilePath() != null);
            r.setPaymentProofFileName(advance == null ? null : advance.getProofFileName());
        }
        return reservations;
    }
}
