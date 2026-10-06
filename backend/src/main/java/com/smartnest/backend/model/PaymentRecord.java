package com.smartnest.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_records")
@Data
@NoArgsConstructor
public class PaymentRecord {

    @Id
    @NextId
    private Long paymentNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private Reservation reservation;

    @JsonIgnore
    public Reservation getReservation() { return reservation; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }

    @Transient
    @JsonProperty("reservationId")
    public Long getReservationId() { return reservation != null ? reservation.getReservationId() : null; }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(nullable = false)
    private LocalDateTime paymentDate;

    @Column(nullable = false)
    private BigDecimal amount;

    /** Original name of the uploaded bank-transfer PDF, shown to staff. */
    private String proofFileName;

    /** Where the PDF is stored on disk; never sent to the browser. */
    @JsonIgnore
    private String proofFilePath;

    @Transient
    @JsonProperty("hasProof")
    public boolean hasProof() { return proofFilePath != null; }

    @PrePersist
    void onCreate() {
        if (paymentDate == null) {
            paymentDate = LocalDateTime.now();
        }
    }
}
