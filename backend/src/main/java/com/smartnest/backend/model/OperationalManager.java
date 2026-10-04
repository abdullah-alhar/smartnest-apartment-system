package com.smartnest.backend.model;

import jakarta.persistence.*;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "operational_managers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class OperationalManager extends Staff {
    private Double ApprovalLimit;
}





