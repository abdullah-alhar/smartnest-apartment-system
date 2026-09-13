package com.smartnest.backend.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "sales_staff")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class SalesStaff extends Staff {

    private Double salesTarget;
}