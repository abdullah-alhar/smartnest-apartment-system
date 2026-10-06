package com.smartnest.backend.service;

import com.smartnest.backend.dto.CreateApartmentRequest;
import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.AvailabilityStatus;
import com.smartnest.backend.model.ListingStatus;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.ReservationStatus;
import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.ApartmentRepository;
import com.smartnest.backend.repository.ReservationRepository;
import com.smartnest.backend.repository.UserRepository;
import com.smartnest.backend.event.ApartmentEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private static final int TITLE_MAX_LENGTH = 255;
    private static final int DESCRIPTION_MAX_LENGTH = 2000;

    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final PricingService pricingService;
    private final ApplicationEventPublisher events; // Observer pattern: we only publish events
    private final ApartmentImageService apartmentImageService;

    @Transactional
    public Apartment createApartment(CreateApartmentRequest request, Long actorId) {
        validate(request);

        Apartment apartment = new Apartment();
        applyDetails(apartment, request);
        apartment.setCreatedByStaffId(actorId);
        apartment.setListingStatus(ListingStatus.PENDING);
        apartment.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);

        Apartment saved = apartmentRepository.save(apartment);
        events.publishEvent(new ApartmentEvent(ApartmentEvent.Action.SUBMITTED, saved, actorId));
        return withCreatedByName(saved);
    }

    private void validate(CreateApartmentRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Apartment title is required");
        }
        if (request.getTitle().length() > TITLE_MAX_LENGTH) {
            throw new IllegalArgumentException("Apartment title cannot exceed " + TITLE_MAX_LENGTH + " characters");
        }
        if (request.getDescription() != null && request.getDescription().length() > DESCRIPTION_MAX_LENGTH) {
            throw new IllegalArgumentException("Description cannot exceed " + DESCRIPTION_MAX_LENGTH + " characters");
        }
        if (request.getPrice() == null || request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        if (request.getRoomCount() == null || request.getRoomCount() <= 0) {
            throw new IllegalArgumentException("Room count must be greater than 0");
        }
        if (request.getSize() == null || request.getSize() <= 0) {
            throw new IllegalArgumentException("Size must be greater than 0");
        }
        if (request.getAddress() == null
                || request.getAddress().getCity() == null || request.getAddress().getCity().isBlank()
                || request.getAddress().getStreet() == null || request.getAddress().getStreet().isBlank()
                || request.getAddress().getPostalCode() == null || request.getAddress().getPostalCode().isBlank()) {
            throw new IllegalArgumentException("Street, city and postal code are all required");
        }
    }

    private void applyDetails(Apartment apartment, CreateApartmentRequest request) {
        apartment.setTitle(request.getTitle().trim());
        apartment.setDescription(request.getDescription());
        apartment.setPrice(request.getPrice());
        apartment.setRoomCount(request.getRoomCount());
        apartment.setSize(request.getSize());
        apartment.setAddress(request.getAddress());
    }

    public Apartment approveApartment(Long apartmentId, Long operationsManagerId, Long actorId) {
        Apartment apartment = getApartment(apartmentId);
        apartment.setListingStatus(ListingStatus.APPROVED);
        apartment.setReviewedByManagerId(operationsManagerId);
        apartment.setRejectionReason(null);
        apartment.setReviewedAt(LocalDateTime.now());
        Apartment saved = apartmentRepository.save(apartment);
        events.publishEvent(new ApartmentEvent(ApartmentEvent.Action.APPROVED, saved, actorId));
        return withCreatedByName(saved);
    }

    public Apartment rejectApartment(Long apartmentId, Long operationsManagerId, String reason, Long actorId) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required");
        }
        Apartment apartment = getApartment(apartmentId);
        apartment.setListingStatus(ListingStatus.REJECTED);
        apartment.setReviewedByManagerId(operationsManagerId);
        apartment.setRejectionReason(reason);
        apartment.setReviewedAt(LocalDateTime.now());
        Apartment saved = apartmentRepository.save(apartment);
        events.publishEvent(new ApartmentEvent(ApartmentEvent.Action.REJECTED, saved, actorId));
        return withCreatedByName(saved);
    }

    public Apartment markSold(Long apartmentId) {
        Apartment apartment = getApartment(apartmentId);
        if (apartment.getAvailabilityStatus() != AvailabilityStatus.RESERVED) {
            throw new IllegalArgumentException("Only a reserved apartment can be marked as sold");
        }
        apartment.setAvailabilityStatus(AvailabilityStatus.SOLD);
        return withCreatedByName(apartmentRepository.save(apartment));
    }

    public List<Apartment> getApprovedApartments(BigDecimal minPrice, BigDecimal maxPrice, Integer roomCount) {
        List<Apartment> approved = apartmentRepository.findByListingStatus(ListingStatus.APPROVED);
        List<Apartment> filtered = approved.stream()
                .filter(a -> minPrice == null || a.getPrice().compareTo(minPrice) >= 0)
                .filter(a -> maxPrice == null || a.getPrice().compareTo(maxPrice) <= 0)
                .filter(a -> roomCount == null || roomCount.equals(a.getRoomCount()))
                .collect(Collectors.toList());
        return withDiscounts(withCreatedByNames(filtered));
    }

    public List<Apartment> getPendingApartments() {
        return withCreatedByNames(apartmentRepository.findByListingStatus(ListingStatus.PENDING));
    }

    public List<Apartment> getMyApartments(Long staffId) {
        return withCreatedByNames(apartmentRepository.findByCreatedByStaffId(staffId));
    }

    @Transactional
    public void deleteApartment(Long apartmentId, Long callerId, boolean isAdmin) {
        Apartment apartment = getApartment(apartmentId);
        if (!isAdmin && !Objects.equals(apartment.getCreatedByStaffId(), callerId)) {
            throw new AccessDeniedException("You can only delete your own apartment listings");
        }
        if (reservationRepository.existsByApartmentApartmentIdAndStatusIn(
                apartmentId, List.of(ReservationStatus.PENDING, ReservationStatus.APPROVED))) {
            throw new IllegalArgumentException(
                    "This apartment has an active reservation, so it can't be deleted. Cancel or reject the reservation first.");
        }
        String imagePath = apartment.getImagePath();
        apartmentRepository.delete(apartment);
        apartmentImageService.deleteFile(imagePath);
    }

    @Transactional
    public Apartment updateApartment(Long apartmentId, CreateApartmentRequest request, Long callerId, boolean isAdmin) {
        Apartment apartment = getApartment(apartmentId);
        if (!isAdmin && !Objects.equals(apartment.getCreatedByStaffId(), callerId)) {
            throw new AccessDeniedException("You can only edit your own apartment listings");
        }
        validate(request);
        applyDetails(apartment, request);
        apartment.setListingStatus(ListingStatus.PENDING);
        apartment.setRejectionReason(null);
        apartment.setReviewedByManagerId(null);
        apartment.setReviewedAt(null);
        Apartment saved = apartmentRepository.save(apartment);
        events.publishEvent(new ApartmentEvent(ApartmentEvent.Action.RESUBMITTED, saved, callerId));
        return withCreatedByName(saved);
    }

    Apartment getApartment(Long id) {
        return apartmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found: " + id));
    }

    private Apartment withCreatedByName(Apartment apartment) {
        return withCreatedByNames(List.of(apartment)).get(0);
    }

    private List<Apartment> withCreatedByNames(List<Apartment> apartments) {
        List<Long> ids = apartments.stream()
                .map(Apartment::getCreatedByStaffId).filter(Objects::nonNull).distinct().toList();
        Map<Long, User> users = userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        for (Apartment a : apartments) {
            User u = users.get(a.getCreatedByStaffId());
            a.setCreatedByName(u == null ? null : (u.getFirstName() + " " + u.getLastName()).trim());
        }
        return apartments;
    }

    private List<Apartment> withDiscounts(List<Apartment> apartments) {
        Map<Long, Promotion> active = pricingService.activePromotionsFor(
                apartments.stream().map(Apartment::getApartmentId).toList());
        for (Apartment a : apartments) {
            Promotion promotion = active.get(a.getApartmentId());
            if (promotion == null) continue;
            a.setActiveDiscountPercentage(promotion.getDiscountPercentage());
            a.setDiscountedPrice(pricingService.discountedPrice(a.getPrice(), promotion.getDiscountPercentage()));
        }
        return apartments;
    }
}
