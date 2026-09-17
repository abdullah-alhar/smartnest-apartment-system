package com.smartnest.backend.repository;

import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.PromotionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    List<Promotion> findBySalesStaffId(Long salesStaffId);

    List<Promotion> findByStatus(PromotionStatus status);
}
