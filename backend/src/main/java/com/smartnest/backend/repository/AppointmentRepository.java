package com.smartnest.backend.repository;

import com.smartnest.backend.model.Appointment;
import com.smartnest.backend.model.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByCustomerUserIdOrderByRequestedDateDesc(Long customerId);

    List<Appointment> findByStatusOrderByRequestedDateAsc(AppointmentStatus status);

    List<Appointment> findByCroUserIdOrderByRequestedDateAsc(Long croId);

    List<Appointment> findAllByOrderByRequestedDateDesc();

    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.apartment.apartmentId = :apartmentId " +
            "AND a.scheduledDate = :dateTime " +
            "AND a.status NOT IN (com.smartnest.backend.model.AppointmentStatus.DECLINED, com.smartnest.backend.model.AppointmentStatus.CANCELLED)")
    boolean isSlotTaken(@Param("apartmentId") Long apartmentId, @Param("dateTime") LocalDateTime dateTime);

    @Query("SELECT COUNT(a) > 0 FROM Appointment a WHERE a.apartment.apartmentId = :apartmentId " +
            "AND a.scheduledDate = :dateTime AND a.appointmentId <> :excludeId " +
            "AND a.status NOT IN (com.smartnest.backend.model.AppointmentStatus.DECLINED, com.smartnest.backend.model.AppointmentStatus.CANCELLED)")
    boolean isSlotTakenExcluding(@Param("apartmentId") Long apartmentId, @Param("dateTime") LocalDateTime dateTime,
                                  @Param("excludeId") Long excludeId);

    @Query("SELECT a FROM Appointment a WHERE a.apartment.apartmentId = :apartmentId " +
            "AND a.scheduledDate >= :start AND a.scheduledDate < :end " +
            "AND a.status NOT IN (com.smartnest.backend.model.AppointmentStatus.DECLINED, com.smartnest.backend.model.AppointmentStatus.CANCELLED)")
    List<Appointment> findActiveAppointmentsForDay(@Param("apartmentId") Long apartmentId,
                                                     @Param("start") LocalDateTime start,
                                                     @Param("end") LocalDateTime end);
}
