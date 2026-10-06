package com.smartnest.backend.repository;

import com.smartnest.backend.model.Reservation;
import com.smartnest.backend.model.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByCustomerUserIdOrderByReservationDateDesc(Long customerId);

    List<Reservation> findByStatusOrderByReservationDateAsc(ReservationStatus status);

    List<Reservation> findAllByOrderByReservationDateDesc();

    boolean existsByApartmentApartmentIdAndStatusIn(Long apartmentId, Collection<ReservationStatus> statuses);

    long countByStatus(ReservationStatus status);
}
