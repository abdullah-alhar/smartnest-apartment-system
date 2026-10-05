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
@Table(name = "reservations")
@Data
@NoArgsConstructor
public class Reservation {

    @Id
    @NextId
    private Long reservationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private Customer customer;

    @JsonIgnore
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    @Transient
    @JsonProperty("customerId")
    public Long getCustomerId() { return customer != null ? customer.getUserId() : null; }

    @Transient
    private String customerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = false)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private Apartment apartment;

    @JsonIgnore
    public Apartment getApartment() { return apartment; }
    public void setApartment(Apartment apartment) { this.apartment = apartment; }

    @Transient
    @JsonProperty("apartmentId")
    public Long getApartmentId() { return apartment != null ? apartment.getApartmentId() : null; }

    @Transient
    private String apartmentTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operations_manager_id")
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private OperationalManager operationsManager;

    @JsonIgnore
    public OperationalManager getOperationsManager() { return operationsManager; }
    public void setOperationsManager(OperationalManager operationsManager) { this.operationsManager = operationsManager; }

    @Transient
    @JsonProperty("operationsManagerId")
    public Long getOperationsManagerId() { return operationsManager != null ? operationsManager.getUserId() : null; }

    @Transient
    private String operationsManagerName;

    @Column(nullable = false)
    private LocalDateTime reservationDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReservationStatus status = ReservationStatus.PENDING;

    @Column(nullable = false)
    private boolean paymentVerified = false;

    private String rejectionReason;

    @Transient
    private BigDecimal totalPaidAmount;

    /** True once the customer has uploaded the transfer PDF for the advance payment. */
    @Transient
    private boolean hasPaymentProof;

    @Transient
    private String paymentProofFileName;

    @PrePersist
    void onCreate() {
        if (reservationDate == null) {
            reservationDate = LocalDateTime.now();
        }
    }
}
