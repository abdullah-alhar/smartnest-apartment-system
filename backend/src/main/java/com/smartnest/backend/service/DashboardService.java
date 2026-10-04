package com.smartnest.backend.service;

import com.smartnest.backend.dto.DashboardSummaryResponse;
import com.smartnest.backend.model.AppointmentStatus;
import com.smartnest.backend.model.AvailabilityStatus;
import com.smartnest.backend.model.InquiryStatus;
import com.smartnest.backend.model.ListingStatus;
import com.smartnest.backend.model.PromotionStatus;
import com.smartnest.backend.model.ReservationStatus;
import com.smartnest.backend.repository.ApartmentRepository;
import com.smartnest.backend.repository.AppointmentRepository;
import com.smartnest.backend.repository.InquiryRepository;
import com.smartnest.backend.repository.PromotionRepository;
import com.smartnest.backend.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ApartmentRepository apartmentRepository;
    private final ReservationRepository reservationRepository;
    private final PromotionRepository promotionRepository;
    private final InquiryRepository inquiryRepository;
    private final AppointmentRepository appointmentRepository;

    public DashboardSummaryResponse summary() {
        LocalDate today = LocalDate.now();
        long activePromotions = promotionRepository.findByStatus(PromotionStatus.APPROVED).stream()
                .filter(p -> !p.getStartDate().isAfter(today) && !p.getEndDate().isBefore(today))
                .count();

        return DashboardSummaryResponse.builder()
                .apartmentsAvailable(apartmentRepository.countLive(ListingStatus.APPROVED, AvailabilityStatus.AVAILABLE))
                .apartmentsReserved(apartmentRepository.countLive(ListingStatus.APPROVED, AvailabilityStatus.RESERVED))
                .apartmentsSold(apartmentRepository.countLive(ListingStatus.APPROVED, AvailabilityStatus.SOLD))
                .listingsPending(apartmentRepository.countByListing(ListingStatus.PENDING))
                .reservationsPending(reservationRepository.countByStatus(ReservationStatus.PENDING))
                .reservationsApproved(reservationRepository.countByStatus(ReservationStatus.APPROVED))
                .reservationsRejected(reservationRepository.countByStatus(ReservationStatus.REJECTED))
                .reservationsCancelled(reservationRepository.countByStatus(ReservationStatus.CANCELLED))
                .promotionsPending(promotionRepository.countByStatus(PromotionStatus.PENDING))
                .promotionsActive(activePromotions)
                .inquiriesNew(inquiryRepository.findByStatusOrderByCreatedDateAsc(InquiryStatus.NEW).size())
                .appointmentsPending(appointmentRepository.findByStatusOrderByRequestedDateAsc(AppointmentStatus.PENDING).size())
                .build();
    }
}
