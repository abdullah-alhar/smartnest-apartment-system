// DESIGN PATTERN: Strategy (Behavioral) - this interface is the Strategy

package com.smartnest.backend.service.sort;

import com.smartnest.backend.model.Apartment;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Root;

import java.math.BigDecimal;
import java.util.List;

/**
 * One way of sorting the apartment search results.
 * Each class that implements this is one sort option the customer can pick (?sort=...).
 * ApartmentQueryService (the Context) chooses one and uses it, without knowing how it sorts.
 */
public interface ApartmentSortStrategy {

    /**
     * @param payablePrice the price after the best active promotion
     * @param discount     the best active discount percentage (0 if none)
     * @return the ORDER BY parts for the query
     */
    List<Order> orderBy(CriteriaBuilder cb, Root<Apartment> apartment,
                        Expression<Number> payablePrice, Expression<BigDecimal> discount);
}
