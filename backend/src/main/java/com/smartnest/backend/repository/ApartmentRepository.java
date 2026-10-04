package com.smartnest.backend.repository;

import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.AvailabilityStatus;
import com.smartnest.backend.model.ListingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ApartmentRepository extends JpaRepository<Apartment, Long>, JpaSpecificationExecutor<Apartment> {

    List<Apartment> findByListingStatus(ListingStatus status);

    List<Apartment> findByCreatedByStaffId(Long staffId);

    long countByListingStatusAndAvailabilityStatus(ListingStatus listingStatus, AvailabilityStatus availabilityStatus);

    default long countLive(ListingStatus listingStatus, AvailabilityStatus availabilityStatus) {
        return countByListingStatusAndAvailabilityStatus(listingStatus, availabilityStatus);
    }

    long countByListingStatus(ListingStatus listingStatus);

    default long countByListing(ListingStatus listingStatus) {
        return countByListingStatus(listingStatus);
    }

    Apartment findFirstByListingStatusOrderByPriceAsc(ListingStatus listingStatus);

    Apartment findFirstByListingStatusOrderByPriceDesc(ListingStatus listingStatus);

    default BigDecimal findMinLivePrice() {
        Apartment a = findFirstByListingStatusOrderByPriceAsc(ListingStatus.APPROVED);
        return a == null ? null : a.getPrice();
    }

    default BigDecimal findMaxLivePrice() {
        Apartment a = findFirstByListingStatusOrderByPriceDesc(ListingStatus.APPROVED);
        return a == null ? null : a.getPrice();
    }
}
