package com.smartnest.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "cros")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class CRO extends Staff {

    private String shiftSchedule;
}