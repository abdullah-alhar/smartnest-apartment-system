# SmartNest Apartment System

SmartNest is a web app for selling and managing apartments. Customers can browse listings, book
site visits, send inquiries and reserve apartments. Staff review listings, promotions, visits and
reservations from their own dashboards.

## Features

| # | Function | What it covers |
|---|---|---|
| 1 | Promotion Management | Sales staff create promotions. An Operations Manager approves or rejects them. Customers are told about approved offers. |
| 2 | Apartment Management | Listings with photos, search, filters and sorting. New and changed listings must be approved. |
| 3 | Appointment Management | Customers book site visits. A CRO approves, reschedules, declines or completes them. |
| 4 | Customer Inquiry Management | Customers send inquiries and a CRO answers or closes them. |
| 5 | Reservation Management | Customers reserve an apartment and upload a PDF payment proof. An Operations Manager approves or rejects it. |

The app also has login and registration (JWT), user profiles, staff accounts created by the
Admin, in-app notifications (the bell) and dashboard charts.

**Roles:** `ADMIN`, `SALES_STAFF`, `CRO`, `OPERATIONS_MANAGER`, `MANAGING_DIRECTOR`,
`MARKETING_EXECUTIVE`, `CUSTOMER`.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Axios, lucide-react |
| Backend | Java 21, Spring Boot 4 (Web MVC, Data JPA, Security, Validation), Lombok, JWT |
| Database | Microsoft SQL Server |

## Project structure

```
smartnest-apartment-system/
├── backend/            Spring Boot REST API (port 8080)
│   ├── src/main/java/com/smartnest/backend/
│   │   ├── config/       security, CORS and web settings
│   │   ├── controller/   REST endpoints (/api/...)
│   │   ├── dto/          request and response objects
│   │   ├── event/        Observer pattern: events and listeners
│   │   ├── exception/    global error handling
│   │   ├── factory/      Factory pattern: StaffFactory
│   │   ├── model/        JPA entities and enums
│   │   ├── repository/   Spring Data repositories
│   │   ├── security/     JWT filter and helpers
│   │   └── service/      business logic
│   │       └── sort/     Strategy pattern: apartment sorting
│   └── uploads/        apartment photos and payment proofs
├── frontend/           React app (port 5173)
│   └── src/
│       ├── api/          Axios calls to the backend
│       ├── components/   shared UI and modals
│       ├── context/      auth, modal and toast state
│       ├── pages/        one file per screen
│       └── utils/
├── database/
│   ├── SmartNestDB_DDL.sql    creates the database and tables
│   └── SmartNestDB_Data.sql   sample data
└── docs/
    └── design-patterns.md     Observer, Strategy, Factory and Singleton explained
```

## Getting started

### Requirements

- JDK 21 or newer
- Node.js 20 or newer, with npm
- SQL Server running on `localhost:1433`, plus SSMS or another SQL client

### 1. Database

1. Open `database/SmartNestDB_DDL.sql` in SSMS and run it (F5). It creates the `SmartNestDB`
   database and all tables.
2. Then run `database/SmartNestDB_Data.sql` to load the sample data.

Hibernate does not create the tables (`ddl-auto=none`), so the DDL script must be run first.

### 2. Backend

Set your SQL Server username and password in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.username=sa
spring.datasource.password=<your password>
```

Then start the API:

```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8080/api`. Uploaded files are saved in `backend/uploads/`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The backend only accepts requests from this address (CORS).

### Sample accounts

The sample data has one Admin (`admin@smartnest.com`) and one customer (`you@example.com`).
Their passwords are stored as BCrypt hashes. You can also register a new customer account, and
the Admin can create staff accounts.

## Useful commands

| Where | Command | What it does |
|---|---|---|
| `backend/` | `./mvnw spring-boot:run` | Start the API |
| `backend/` | `./mvnw clean package` | Build the JAR |
| `frontend/` | `npm run dev` | Start the dev server |
| `frontend/` | `npm run build` | Build for production into `dist/` |
| `frontend/` | `npm run lint` | Run ESLint |

## Design patterns

The backend uses four design patterns: **Observer**, **Strategy**, **Factory** and **Singleton**.
Each class that takes part in one starts with a `// DESIGN PATTERN:` comment. See
[docs/design-patterns.md](docs/design-patterns.md) for the full explanation.
