// DESIGN PATTERN: Strategy (Behavioral) - this class is a Concrete Strategy

package com.smartnest.backend.service.sort;

import com.smartnest.backend.model.Apartment;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Root;

import java.math.BigDecimal;
import java.util.List;

/** ?sort=priceDesc: most expensive payable price first. */
public class PriceHighToLowSort implements ApartmentSortStrategy {

    @Override
    public List<Order> orderBy(CriteriaBuilder cb, Root<Apartment> apartment,
                               Expression<Number> payablePrice, Expression<BigDecimal> discount) {
        return List.of(cb.desc(payablePrice), cb.desc(apartment.get("apartmentId")));
    }
}
