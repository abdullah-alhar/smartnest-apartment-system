package com.smartnest.backend.repository;

import com.smartnest.backend.model.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {

    List<PaymentRecord> findByReservationReservationId(Long reservationId);

    List<PaymentRecord> findByReservationReservationIdIn(List<Long> reservationIds);
}
