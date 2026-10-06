# Design Patterns in SmartNest

SmartNest uses four design patterns from the SE2030 lectures. They are all in the backend
(`backend/src/main/java/com/smartnest/backend/`). Every class that takes part in a pattern has a
comment at the very top that starts with `// DESIGN PATTERN:`, so you can find them all with one search.

| Pattern   | Category    | Group member's function                                       | Main classes |
|-----------|-------------|---------------------------------------------------------------|--------------|
| Observer  | Behavioral  | 1 Promotion, 3 Appointment, 4 Inquiry, 5 Reservation (and 2 Apartment listings) | `PromotionEvent`, `NotificationListener`, `PromotionOfferListener`, `ActivityLogListener` |
| Strategy  | Behavioral  | 2 Apartment Management (sorting the apartment list)           | `ApartmentSortStrategy`, `NewestFirstSort`, `PriceLowToHighSort`, `PriceHighToLowSort`, `BiggestDiscountSort` |
| Factory   | Creational  | Staff account management (Admin creates staff)                | `StaffFactory` |
| Singleton | Creational  | Shared by all functions                                       | `NotificationService`, `PricingService` (and every Spring `@Service`) |

Group member names for the report:

| Function | Member |
|---|---|
| 1 Promotion Management | ____________ |
| 2 Apartment Management | ____________ |
| 3 Appointment Management | ____________ |
| 4 Customer Inquiry Management | ____________ |
| 5 Reservation Management | ____________ |

---

## 1. Observer

**Category:** Behavioral

**Belongs to:** Function 1 Promotion Management (main demo). The same idea is also used in
Function 3 Appointment, Function 4 Inquiry, Function 5 Reservation and Apartment listing approval.

### The problem it solves

Many things in SmartNest need to "tell someone" when something happens:

- An Operations Manager approves a promotion, so the sales staff member must be told, **and** every
  customer should hear about the new offer.
- A CRO answers an inquiry, so the customer must be told.
- A CRO approves, reschedules or declines a site visit, so the customer must be told.
- An Operations Manager approves a reservation, so the customer must be told.

Before, every service (`PromotionService`, `InquiryService`, `AppointmentService`, ...) called
`NotificationService` directly. That means each service had to know about notifications, and
adding a new reaction (for example "also tell customers about approved promotions") meant editing
the service again.

With Observer, a service only **announces what happened** (it publishes an event). Any number of
listeners can react to it. The service does not know, or care, who is listening.

### Classes and their roles

| Role | Class | What it does |
|---|---|---|
| **Subject** (publisher) | `PromotionService`, `ApartmentService`, `InquiryService`, `AppointmentService`, `ReservationService` | Publishes an event after saving a change. |
| **Event** (the message) | `PromotionEvent`, `ApartmentEvent`, `InquiryEvent`, `AppointmentEvent`, `ReservationEvent` (all implement `SmartNestEvent`) | Says *what* happened (`APPROVED`, `REJECTED`, ...) and to *which* object. |
| **Observer** | `NotificationListener` | Creates the normal in-app notifications (same messages as before). |
| **Observer** | `PromotionOfferListener` | When a promotion is approved, tells every **active customer**: "New offer: {title} - {discount}% off". Clicking it opens `/promotions`. |
| **Observer** | `ActivityLogListener` | Writes one line to the backend console for **every** event, e.g. `[SmartNest event] Promotion #5 APPROVED`. |
| Event bus | Spring's `ApplicationEventPublisher` | Delivers each event to every matching `@EventListener` method. |

So one Subject (`PromotionService`) has **three** Observers for the same "promotion approved" event.

### UML-style class list

```
<<interface>> SmartNestEvent
    + summary() : String

PromotionEvent  (record)  implements SmartNestEvent
    + action    : Action      {SUBMITTED, RESUBMITTED, APPROVED, REJECTED}
    + promotion : Promotion
    + actorId   : Long

PromotionService                      (Subject)
    - events : ApplicationEventPublisher
    + approvePromotion(...) : Promotion     --publishes--> PromotionEvent

NotificationListener                  (Observer)
    - notificationService : NotificationService
    + onPromotion(PromotionEvent)
    + onApartment(ApartmentEvent)
    + onInquiry(InquiryEvent)
    + onAppointment(AppointmentEvent)
    + onReservation(ReservationEvent)

PromotionOfferListener                (Observer)
    + onPromotion(PromotionEvent)   // only reacts to APPROVED

ActivityLogListener                   (Observer)
    + onAnyEvent(SmartNestEvent)    // hears every event
```

### Code snippet

The Subject only publishes (`service/PromotionService.java`):

```java
private final ApplicationEventPublisher events; // Observer pattern: we only publish events

public Promotion approvePromotion(Long promotionId, Long operationsManagerId, Long actorId) {
    ...
    Promotion saved = promotionRepository.save(promotion);
    events.publishEvent(new PromotionEvent(PromotionEvent.Action.APPROVED, saved, actorId));
    return withCreatorName(saved);
}
```

An Observer reacts (`event/PromotionOfferListener.java`):

```java
// DESIGN PATTERN: Observer (Behavioral) - this class is an Observer (listener)
@Component
public class PromotionOfferListener {

    private final NotificationService notificationService;

    @EventListener
    public void onPromotion(PromotionEvent e) {
        if (e.action() == PromotionEvent.Action.APPROVED) {
            notificationService.promotionOfferToCustomers(e.promotion());
        }
    }
}
```

**Key point for the demo:** the "notify customers about new offers" feature was added as a new
Observer class. `PromotionService` did not change at all for it.

### Things to know

- Spring runs the listeners straight away, in the same thread and the same database transaction, so
  the result is exactly the same as calling `NotificationService` directly.
- All notification messages are the same as before. The only new message is the customer offer.

---

## 2. Strategy

**Category:** Behavioral

**Belongs to:** Function 2 Apartment Management (customers sorting the apartment list).

### The problem it solves

On the Apartments page a customer can sort by **Newest first**, **Price: low to high**,
**Price: high to low** or **Biggest discount**. The frontend sends this as `?sort=...`.

Before, `ApartmentQueryService` had a `switch` with one `case` per sort option. Every new sort
option meant editing that `switch` inside a long search method.

With Strategy, each way of sorting is its own small class with the same method. The search code
just picks one and calls it. To add a new sort, you write one new class and add one line to the map.

### Classes and their roles

| Role | Class | What it does |
|---|---|---|
| **Strategy** (interface) | `ApartmentSortStrategy` | Declares `orderBy(...)`, which returns how to order the results. |
| **Concrete Strategy** | `NewestFirstSort` | `?sort=newest` (also the default): newest listings first. |
| **Concrete Strategy** | `PriceLowToHighSort` | `?sort=priceAsc`: cheapest price (after discount) first. |
| **Concrete Strategy** | `PriceHighToLowSort` | `?sort=priceDesc`: most expensive first. |
| **Concrete Strategy** | `BiggestDiscountSort` | `?sort=discount`: biggest active discount first. |
| **Context** | `ApartmentQueryService` | Keeps a map from the `?sort=` value to a strategy, picks one, and uses it. |

### UML-style class list

```
<<interface>> ApartmentSortStrategy                        (Strategy)
    + orderBy(cb, apartment, payablePrice, discount) : List<Order>

NewestFirstSort      implements ApartmentSortStrategy      (Concrete Strategy)
PriceLowToHighSort   implements ApartmentSortStrategy      (Concrete Strategy)
PriceHighToLowSort   implements ApartmentSortStrategy      (Concrete Strategy)
BiggestDiscountSort  implements ApartmentSortStrategy      (Concrete Strategy)

ApartmentQueryService                                      (Context)
    - SORT_STRATEGIES : Map<String, ApartmentSortStrategy>
    - DEFAULT_SORT    : ApartmentSortStrategy
    + search(criteria) : PageResponse<ApartmentCardResponse>
```

### Code snippet

The Context (`service/ApartmentQueryService.java`):

```java
// DESIGN PATTERN: Strategy (Behavioral) - this class is the Context; it holds the sort strategies.
private static final ApartmentSortStrategy DEFAULT_SORT = new NewestFirstSort();
private static final Map<String, ApartmentSortStrategy> SORT_STRATEGIES = Map.of(
        "newest", DEFAULT_SORT,
        "priceAsc", new PriceLowToHighSort(),
        "priceDesc", new PriceHighToLowSort(),
        "discount", new BiggestDiscountSort());

...
ApartmentSortStrategy sortStrategy = c.getSort() == null
        ? DEFAULT_SORT
        : SORT_STRATEGIES.getOrDefault(c.getSort(), DEFAULT_SORT);
query.orderBy(sortStrategy.orderBy(cb, root, payable, discount));
```

One Concrete Strategy (`service/sort/PriceLowToHighSort.java`):

```java
// DESIGN PATTERN: Strategy (Behavioral) - this class is a Concrete Strategy
public class PriceLowToHighSort implements ApartmentSortStrategy {

    @Override
    public List<Order> orderBy(CriteriaBuilder cb, Root<Apartment> apartment,
                               Expression<Number> payablePrice, Expression<BigDecimal> discount) {
        return List.of(cb.asc(payablePrice), cb.desc(apartment.get("apartmentId")));
    }
}
```

### Things to know

- The `?sort=` values did not change, so the frontend did not need any change.
- A missing or unknown `?sort=` value falls back to "newest", the same as before.

---

## 3. Factory

**Category:** Creational

**Belongs to:** Staff account management. An Admin creates staff accounts (Sales Staff, CRO,
Operations Manager, Admin, Marketing Executive). It supports every function, because each function
needs its staff role to exist.

### The problem it solves

The system has one parent class `Staff` and several subclasses: `Admin`, `CRO`, `SalesStaff`,
`OperationalManager`, `MarketingExecutive`. When an Admin creates an account, the system must
create the **right subclass** for the chosen role.

Before, `AdminController` had a `switch` that called `new Admin()`, `new CRO()` and so on. The controller
had to know every staff subclass.

With Factory, the controller just asks `staffFactory.create(role)` and gets back the correct
object. Only the factory knows which class matches which role.

### Classes and their roles

| Role | Class | What it does |
|---|---|---|
| **Factory** | `StaffFactory` | `create(Role)` returns the right `Staff` subclass. |
| **Product** (parent type) | `Staff` | What the caller gets back. |
| **Concrete Products** | `Admin`, `CRO`, `SalesStaff`, `OperationalManager`, `MarketingExecutive` | The real objects the factory creates. |
| **Client** | `AdminController` | Uses the factory; never calls `new Admin()` etc. itself. |

### UML-style class list

```
StaffFactory                                   (Factory)
    + create(role : Role) : Staff

Staff               extends User               (Product)
Admin               extends Staff              (Concrete Product)
CRO                 extends Staff              (Concrete Product)
SalesStaff          extends Staff              (Concrete Product)
OperationalManager  extends Staff              (Concrete Product)
MarketingExecutive  extends Staff              (Concrete Product)

AdminController                                (Client)
    - staffFactory : StaffFactory
    + createStaff(request) : ResponseEntity<String>
```

### Code snippet

The Factory (`factory/StaffFactory.java`):

```java
// DESIGN PATTERN: Factory (Creational) - this class is the Factory
@Component
public class StaffFactory {

    public Staff create(Role role) {
        if (role == null) {
            throw new IllegalArgumentException("Invalid staff role");
        }
        return switch (role) {
            case ADMIN -> new Admin();
            case CRO -> new CRO();
            case SALES_STAFF -> new SalesStaff();
            case OPERATIONS_MANAGER -> new OperationalManager();
            case MARKETING_EXECUTIVE -> new MarketingExecutive();
            default -> throw new IllegalArgumentException("Invalid staff role");
        };
    }
}
```

The Client (`controller/AdminController.java`):

```java
// Factory pattern: the factory decides which Staff subclass to create for this role.
Staff staff = staffFactory.create(request.getRole());
```

---

## 4. Singleton

**Category:** Creational

**Belongs to:** All functions (shared services).

### The problem it solves

Some objects should exist **only once** in the whole application, and everyone should share that
one object. For example, there should be a single `NotificationService` that all five functions use,
and a single `PricingService` that calculates discounted prices the same way everywhere.

In SmartNest the **Spring container** handles this. Every class marked `@Service`, `@Component`,
`@RestController` or `@Configuration` is created **once** when the app starts. That one object is then
given (injected) to every class that needs it. Nobody calls `new NotificationService()`.

This is the same idea as the textbook Singleton (private constructor + `getInstance()`), except
that Spring does the "only create it once" part for us.

### Classes and their roles

| Role | Class | Shared by |
|---|---|---|
| **Singleton** | `NotificationService` | `NotificationListener`, `PromotionOfferListener`, `NotificationController` |
| **Singleton** | `PricingService` | `PromotionService`, `ApartmentService`, `ApartmentQueryService` |
| **Singleton** | `StaffFactory` | `AdminController` |
| **Singleton** (other examples) | Every `@Service` (`PromotionService`, `ApartmentService`, `AppointmentService`, `InquiryService`, `ReservationService`, `UserService`, `DashboardService`, ...), `JwtUtil`, `PasswordEncoder` bean | |
| "getInstance()" | Spring container (constructor injection with `@RequiredArgsConstructor`) | |

### UML-style class list

```
NotificationService  <<singleton, managed by Spring>>
    + promotionApproved(promotion, actorId)
    + promotionOfferToCustomers(promotion)
    + inquiryResponded(inquiry)
    + appointmentApproved(appointment)
    + reservationApproved(reservation)
    ...

NotificationListener    --uses the one-and-only--> NotificationService
PromotionOfferListener  --uses the one-and-only--> NotificationService
NotificationController  --uses the one-and-only--> NotificationService
```

### Code snippet

`service/NotificationService.java`:

```java
// DESIGN PATTERN: Singleton (Creational) - Spring creates only ONE NotificationService and shares it everywhere
@Service
@RequiredArgsConstructor
public class NotificationService { ... }
```

Two different classes get the **same** object:

```java
@Component
@RequiredArgsConstructor
public class NotificationListener {
    private final NotificationService notificationService;   // the one shared object
}

@Component
@RequiredArgsConstructor
public class PromotionOfferListener {
    private final NotificationService notificationService;   // the very same object
}
```

---

## How to find every pattern class

From the project root:

```bash
grep -rn "DESIGN PATTERN" backend/src/main/java
```

| Folder / file | Pattern |
|---|---|
| `event/` (all files) | Observer |
| `service/sort/` (all files) and `service/ApartmentQueryService.java` | Strategy |
| `factory/StaffFactory.java`, used in `controller/AdminController.java` | Factory |
| `service/NotificationService.java`, `service/PricingService.java` | Singleton |
