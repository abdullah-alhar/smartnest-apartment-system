package com.smartnest.backend.repository;

import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    List<Promotion> findBySalesStaffId(Long salesStaffId);

    List<Promotion> findByStatus(PromotionStatus status);

    long countByStatus(PromotionStatus status);

    @Query("SELECT p FROM Promotion p WHERE p.status = com.smartnest.backend.model.PromotionStatus.APPROVED " +
            "AND p.startDate <= :today AND p.endDate >= :today AND p.apartment.apartmentId IN :apartmentIds")
    List<Promotion> findActiveForApartments(@Param("apartmentIds") Collection<Long> apartmentIds,
                                            @Param("today") LocalDate today);

    @Query("SELECT p FROM Promotion p WHERE p.status = com.smartnest.backend.model.PromotionStatus.APPROVED " +
            "AND p.isFeatured = true AND p.startDate <= :today AND p.endDate >= :today")
    List<Promotion> findActiveFeatured(@Param("today") LocalDate today);
}
