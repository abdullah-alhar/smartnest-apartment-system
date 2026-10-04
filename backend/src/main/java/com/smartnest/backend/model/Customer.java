package com.smartnest.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "customers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Customer extends User {

    @Column(unique = true)
    private String nic;

    @Embedded
    private Address address;
}