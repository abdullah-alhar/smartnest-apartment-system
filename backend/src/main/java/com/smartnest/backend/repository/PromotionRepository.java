package com.smartnest.backend.repository;

import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    List<Promotion> findByStatus(PromotionStatus status);
    List <Promotion> findBySalesStaffId(Long salesStaffId);
}
