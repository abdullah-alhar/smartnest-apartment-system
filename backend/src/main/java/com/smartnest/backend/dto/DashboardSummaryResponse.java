package com.smartnest.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private long apartmentsAvailable;
    private long apartmentsReserved;
    private long apartmentsSold;
    private long listingsPending;

    private long reservationsPending;
    private long reservationsApproved;
    private long reservationsRejected;
    private long reservationsCancelled;

    private long promotionsPending;
    private long promotionsActive;

    private long inquiriesNew;
    private long appointmentsPending;
}
