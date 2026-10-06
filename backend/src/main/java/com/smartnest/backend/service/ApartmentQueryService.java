package com.smartnest.backend.service;

import com.smartnest.backend.dto.ApartmentCardResponse;
import com.smartnest.backend.dto.ApartmentDetailResponse;
import com.smartnest.backend.dto.ApartmentSearchCriteria;
import com.smartnest.backend.dto.PageResponse;
import com.smartnest.backend.dto.PriceRangeResponse;
import com.smartnest.backend.exception.ResourceNotFoundException;
import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.ListingStatus;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.PromotionStatus;
import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.ApartmentRepository;
import com.smartnest.backend.repository.PromotionRepository;
import com.smartnest.backend.repository.UserRepository;
import com.smartnest.backend.service.sort.ApartmentSortStrategy;
import com.smartnest.backend.service.sort.BiggestDiscountSort;
import com.smartnest.backend.service.sort.NewestFirstSort;
import com.smartnest.backend.service.sort.PriceHighToLowSort;
import com.smartnest.backend.service.sort.PriceLowToHighSort;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApartmentQueryService {

    private static final int MAX_PAGE_SIZE = 48;
    private static final int SIMILAR_LIMIT = 4;
    private static final int FEATURED_LIMIT = 6;

    // DESIGN PATTERN: Strategy (Behavioral) - this class is the Context; it holds the sort strategies.
    // The key is the ?sort= value sent by the frontend. To add a new sort, add one class and one line here.
    private static final ApartmentSortStrategy DEFAULT_SORT = new NewestFirstSort();
    private static final Map<String, ApartmentSortStrategy> SORT_STRATEGIES = Map.of(
            "newest", DEFAULT_SORT,
            "priceAsc", new PriceLowToHighSort(),
            "priceDesc", new PriceHighToLowSort(),
            "discount", new BiggestDiscountSort());

    private final ApartmentRepository apartmentRepository;
    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;
    private final PricingService pricingService;

    public PageResponse<ApartmentCardResponse> search(ApartmentSearchCriteria c) {
        int size = Math.min(Math.max(c.getSize(), 1), MAX_PAGE_SIZE);
        int page = Math.max(c.getPage(), 0);

        Page<Apartment> result = apartmentRepository.findAll(searchSpec(c), PageRequest.of(page, size));
        return new PageResponse<>(toCards(result.getContent()), page, size,
                result.getTotalElements(), result.getTotalPages());
    }

    private Specification<Apartment> searchSpec(ApartmentSearchCriteria c) {
        return (root, query, cb) -> {
            LocalDate today = LocalDate.now();
            List<Predicate> where = new ArrayList<>(livePredicates(root, cb));

            if (c.getKeyword() != null && !c.getKeyword().isBlank()) {
                // Search matches the apartment name only.
                String like = "%" + c.getKeyword().trim().toLowerCase() + "%";
                where.add(cb.like(cb.lower(root.get("title")), like));
            }
            if (c.getStatus() != null) {
                where.add(cb.equal(root.get("availabilityStatus"), c.getStatus()));
            }

            Expression<BigDecimal> discount = cb.coalesce(bestDiscountSubquery(query, cb, root, today), BigDecimal.ZERO);
            Expression<Number> payable = payablePrice(cb, root, discount);

            if (Boolean.TRUE.equals(c.getWithPromotion())) {
                where.add(cb.greaterThan(discount, BigDecimal.ZERO));
            }
            if (c.getMinPrice() != null) where.add(cb.ge(payable, c.getMinPrice()));
            if (c.getMaxPrice() != null) where.add(cb.le(payable, c.getMaxPrice()));

            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                // Strategy pattern: pick the sort strategy for ?sort=..., or "newest" if it is missing/unknown.
                ApartmentSortStrategy sortStrategy = c.getSort() == null
                        ? DEFAULT_SORT
                        : SORT_STRATEGIES.getOrDefault(c.getSort(), DEFAULT_SORT);
                query.orderBy(sortStrategy.orderBy(cb, root, payable, discount));
            }
            return cb.and(where.toArray(new Predicate[0]));
        };
    }

    private List<Predicate> livePredicates(Root<Apartment> root, CriteriaBuilder cb) {
        return List.of(cb.equal(root.get("listingStatus"), ListingStatus.APPROVED));
    }

    private Subquery<BigDecimal> bestDiscountSubquery(CriteriaQuery<?> query, CriteriaBuilder cb,
                                                      Root<Apartment> apartment, LocalDate today) {
        Subquery<BigDecimal> sub = query.subquery(BigDecimal.class);
        Root<Promotion> p = sub.from(Promotion.class);
        sub.select(cb.max(p.<BigDecimal>get("discountPercentage")))
                .where(cb.equal(p.get("apartment").get("apartmentId"), apartment.get("apartmentId")),
                        cb.equal(p.get("status"), PromotionStatus.APPROVED),
                        cb.lessThanOrEqualTo(p.<LocalDate>get("startDate"), today),
                        cb.greaterThanOrEqualTo(p.<LocalDate>get("endDate"), today));
        return sub;
    }

    private Expression<Number> payablePrice(CriteriaBuilder cb, Root<Apartment> root, Expression<BigDecimal> discount) {
        Expression<Number> fraction = cb.quot(discount, BigDecimal.valueOf(100));
        Expression<Number> factor = cb.diff(cb.literal((Number) BigDecimal.ONE), fraction);
        return cb.prod(root.<Number>get("price"), factor);
    }

    public PriceRangeResponse getPriceRange() {
        BigDecimal min = apartmentRepository.findMinLivePrice();
        BigDecimal max = apartmentRepository.findMaxLivePrice();
        if (min == null || max == null) {
            return new PriceRangeResponse(BigDecimal.ZERO, BigDecimal.valueOf(100_000_000L));
        }
        BigDecimal million = BigDecimal.valueOf(1_000_000L);
        BigDecimal low = min.divide(million, 0, RoundingMode.FLOOR).multiply(million);
        BigDecimal high = max.divide(million, 0, RoundingMode.CEILING).multiply(million);
        return new PriceRangeResponse(low, high.compareTo(low) > 0 ? high : low.add(million));
    }

    public ApartmentDetailResponse getPublicDetail(Long id) {
        Apartment apartment = apartmentRepository.findById(id)
                .filter(a -> a.getListingStatus() == ListingStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));
        return toDetail(apartment);
    }

    public ApartmentDetailResponse getManageDetail(Long id, Long callerId, boolean canSeeAll) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));
        if (!canSeeAll && !Objects.equals(apartment.getCreatedByStaffId(), callerId)) {
            throw new AccessDeniedException("You can only open your own apartment listings");
        }
        return toDetail(apartment);
    }

    public List<ApartmentCardResponse> getSimilar(Long id) {
        Apartment base = apartmentRepository.findById(id)
                .filter(a -> a.getListingStatus() == ListingStatus.APPROVED)
                .orElseThrow(() -> new ResourceNotFoundException("Apartment not found"));

        String city = base.getAddress() == null || base.getAddress().getCity() == null
                ? null : base.getAddress().getCity().trim().toLowerCase();
        BigDecimal low = base.getPrice().multiply(new BigDecimal("0.70"));
        BigDecimal high = base.getPrice().multiply(new BigDecimal("1.30"));

        Specification<Apartment> spec = (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>(livePredicates(root, cb));
            where.add(cb.notEqual(root.get("apartmentId"), id));
            Predicate priceClose = cb.between(root.<BigDecimal>get("price"), low, high);
            where.add(city == null ? priceClose
                    : cb.or(priceClose, cb.equal(cb.lower(root.get("address").get("city")), city)));
            return cb.and(where.toArray(new Predicate[0]));
        };
        List<Apartment> candidates = apartmentRepository.findAll(spec, PageRequest.of(0, 40)).getContent();

        List<Apartment> ranked = candidates.stream()
                .sorted(Comparator
                        .comparing((Apartment a) -> !sameCity(a, city))
                        .thenComparing(a -> a.getPrice().subtract(base.getPrice()).abs()))
                .limit(SIMILAR_LIMIT)
                .toList();
        return toCards(ranked);
    }

    private boolean sameCity(Apartment a, String city) {
        return city != null && a.getAddress() != null && a.getAddress().getCity() != null
                && a.getAddress().getCity().trim().equalsIgnoreCase(city);
    }

    public List<ApartmentCardResponse> getFeatured() {
        List<Long> ids = promotionRepository.findActiveFeatured(LocalDate.now()).stream()
                .map(Promotion::getApartmentId).filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) return List.of();
        List<Apartment> apartments = apartmentRepository.findAllById(ids).stream()
                .filter(a -> a.getListingStatus() == ListingStatus.APPROVED)
                .sorted(Comparator.comparing(Apartment::getApartmentId).reversed())
                .limit(FEATURED_LIMIT)
                .toList();
        return toCards(apartments);
    }

    public List<ApartmentCardResponse> toCards(List<Apartment> apartments) {
        if (apartments.isEmpty()) return List.of();
        List<Long> ids = apartments.stream().map(Apartment::getApartmentId).toList();
        Map<Long, Promotion> promotions = pricingService.activePromotionsFor(ids);

        List<ApartmentCardResponse> cards = new ArrayList<>();
        for (Apartment a : apartments) {
            Promotion promo = promotions.get(a.getApartmentId());
            cards.add(ApartmentCardResponse.builder()
                    .apartmentId(a.getApartmentId())
                    .title(a.getTitle())
                    .city(a.getAddress() == null ? null : a.getAddress().getCity())
                    .street(a.getAddress() == null ? null : a.getAddress().getStreet())
                    .price(a.getPrice())
                    .discountedPrice(promo == null ? null : pricingService.discountedPrice(a.getPrice(), promo.getDiscountPercentage()))
                    .discountPercentage(promo == null ? null : promo.getDiscountPercentage())
                    .roomCount(a.getRoomCount())
                    .size(a.getSize())
                    .availabilityStatus(a.getAvailabilityStatus())
                    .listedDate(a.getListedDate())
                    .createdByStaffId(a.getCreatedByStaffId())
                    .imageUrl(a.getImageUrl())
                    .build());
        }
        return cards;
    }

    public ApartmentDetailResponse toDetail(Apartment a) {
        Promotion promo = pricingService.activePromotionsFor(List.of(a.getApartmentId())).get(a.getApartmentId());
        BigDecimal discounted = promo == null ? null : pricingService.discountedPrice(a.getPrice(), promo.getDiscountPercentage());
        BigDecimal payable = discounted != null ? discounted : a.getPrice();

        User creator = a.getCreatedByStaffId() == null ? null : userRepository.findById(a.getCreatedByStaffId()).orElse(null);

        return ApartmentDetailResponse.builder()
                .apartmentId(a.getApartmentId())
                .title(a.getTitle())
                .description(a.getDescription())
                .price(a.getPrice())
                .discountedPrice(discounted)
                .discountPercentage(promo == null ? null : promo.getDiscountPercentage())
                .promotion(promo == null ? null : pricingService.summarize(promo))
                .advancePaymentAmount(pricingService.advancePayment(payable))
                .roomCount(a.getRoomCount())
                .size(a.getSize())
                .address(a.getAddress())
                .availabilityStatus(a.getAvailabilityStatus())
                .listingStatus(a.getListingStatus())
                .rejectionReason(a.getRejectionReason())
                .listedDate(a.getListedDate())
                .daysListed(a.getListedDate() == null ? 0 : ChronoUnit.DAYS.between(a.getListedDate(), LocalDate.now()))
                .createdByStaffId(a.getCreatedByStaffId())
                .createdByName(creator == null ? null : (creator.getFirstName() + " " + creator.getLastName()).trim())
                .imageUrl(a.getImageUrl())
                .build();
    }
}
