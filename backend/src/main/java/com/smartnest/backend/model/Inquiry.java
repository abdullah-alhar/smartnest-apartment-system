package com.smartnest.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "inquiries")
@Data
@NoArgsConstructor
public class Inquiry {

    @Id
    @NextId
    private Long inquiryId;

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
    @JoinColumn(name = "cro_id")
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private CRO cro;

    @JsonIgnore
    public CRO getCro() { return cro; }
    public void setCro(CRO cro) { this.cro = cro; }

    @Transient
    @JsonProperty("croId")
    public Long getCroId() { return cro != null ? cro.getUserId() : null; }

    @Transient
    private String croName;

    @Column(nullable = false, length = 2000)
    private String question;

    @Column(length = 2000)
    private String staffReply;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InquiryStatus status = InquiryStatus.NEW;

    @Column(nullable = false)
    private LocalDateTime createdDate;

    @PrePersist
    void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
    }
}
