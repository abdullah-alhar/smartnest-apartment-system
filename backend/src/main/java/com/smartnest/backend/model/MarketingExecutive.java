package com.smartnest.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "marketing_executives")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class MarketingExecutive extends Staff {

    private String campaignFocus;
}
