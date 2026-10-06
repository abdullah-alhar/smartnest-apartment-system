-- SmartNest Apartment System - tables (SQL Server)
-- Open in SSMS and press Execute (F5).
-- Data types used: INT, VARCHAR, BIT (true/false), DECIMAL (money), DATE, DATETIME
-- IDs are plain INT PRIMARY KEY. The backend gives each new row the next number.

CREATE DATABASE SmartNestDB;
GO

USE SmartNestDB;
GO


-- ============ Users ============

CREATE TABLE users (
    user_id         INT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    contact_number  VARCHAR(255),
    role            VARCHAR(30),
    is_active       BIT DEFAULT 1,
    CHECK (role IN ('CUSTOMER', 'ADMIN', 'SALES_STAFF', 'CRO',
                    'OPERATIONS_MANAGER', 'MARKETING_EXECUTIVE', 'MANAGING_DIRECTOR'))
);

CREATE TABLE customers (
    user_id      INT PRIMARY KEY REFERENCES users (user_id),
    nic          VARCHAR(12) UNIQUE,
    street       VARCHAR(255),
    city         VARCHAR(255),
    postal_code  VARCHAR(255)
);

CREATE TABLE staff (
    user_id     INT PRIMARY KEY REFERENCES users (user_id),
    department  VARCHAR(255),
    hire_date   DATE
);

-- Each staff type has its own table and uses the same user_id as staff.

CREATE TABLE admins (
    user_id       INT PRIMARY KEY REFERENCES staff (user_id),
    access_level  VARCHAR(255)
);

CREATE TABLE sales_staff (
    user_id       INT PRIMARY KEY REFERENCES staff (user_id),
    sales_target  DECIMAL(12,2)
);

CREATE TABLE cros (
    user_id         INT PRIMARY KEY REFERENCES staff (user_id),
    shift_schedule  VARCHAR(255)
);

CREATE TABLE operational_managers (
    user_id         INT PRIMARY KEY REFERENCES staff (user_id),
    approval_limit  DECIMAL(12,2)
);

CREATE TABLE marketing_executives (
    user_id         INT PRIMARY KEY REFERENCES staff (user_id),
    campaign_focus  VARCHAR(255)
);


-- ============ Apartments ============

CREATE TABLE apartments (
    apartment_id            INT PRIMARY KEY,
    title                   VARCHAR(255) NOT NULL,
    description             VARCHAR(2000),
    price                   DECIMAL(12,2) NOT NULL CHECK (price > 0),
    room_count              INT NOT NULL CHECK (room_count > 0),
    size                    DECIMAL(10,2) NOT NULL CHECK (size > 0),
    street                  VARCHAR(255),
    city                    VARCHAR(255),
    postal_code             VARCHAR(255),
    availability_status     VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    listing_status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    listed_date             DATE NOT NULL DEFAULT GETDATE(),
    image_path              VARCHAR(255),
    created_by_staff_id     INT,
    reviewed_by_manager_id  INT,
    reviewed_at             DATETIME,
    rejection_reason        VARCHAR(255),
    CHECK (availability_status IN ('AVAILABLE', 'RESERVED', 'SOLD')),
    CHECK (listing_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    -- a rejected listing must have a reason
    CHECK (listing_status <> 'REJECTED' OR rejection_reason IS NOT NULL)
);


-- ============ Promotions ============

CREATE TABLE promotions (
    id                      INT PRIMARY KEY,
    apartment_id            INT REFERENCES apartments (apartment_id),
    sales_staff_id          INT,
    title                   VARCHAR(255) NOT NULL,
    discount_details        VARCHAR(1000),
    discount_percentage     DECIMAL(5,2) NOT NULL CHECK (discount_percentage BETWEEN 1 AND 90),
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    is_featured             BIT NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    rejection_reason        VARCHAR(255),
    reviewed_by_manager_id  INT,
    reviewed_at             DATETIME,
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CHECK (end_date > start_date),
    CHECK (status <> 'REJECTED' OR rejection_reason IS NOT NULL)
);


-- ============ Reservations and payments ============

CREATE TABLE reservations (
    reservation_id         INT PRIMARY KEY,
    customer_id            INT NOT NULL REFERENCES customers (user_id),
    apartment_id           INT NOT NULL REFERENCES apartments (apartment_id),
    operations_manager_id  INT REFERENCES operational_managers (user_id),
    reservation_date       DATETIME NOT NULL DEFAULT GETDATE(),
    status                 VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_verified       BIT NOT NULL DEFAULT 0,
    rejection_reason       VARCHAR(255),
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    CHECK (status <> 'REJECTED' OR rejection_reason IS NOT NULL)
);

CREATE TABLE payment_records (
    payment_no       INT PRIMARY KEY,
    reservation_id   INT NOT NULL REFERENCES reservations (reservation_id),
    payment_method   VARCHAR(30) NOT NULL,
    payment_date     DATETIME NOT NULL DEFAULT GETDATE(),
    amount           DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    proof_file_name  VARCHAR(255),
    proof_file_path  VARCHAR(255),
    CHECK (payment_method IN ('CARD', 'BANK_TRANSFER', 'ONLINE', 'CASH'))
);


-- ============ Site visits (appointments) ============

CREATE TABLE appointments (
    appointment_id  INT PRIMARY KEY,
    customer_id     INT NOT NULL REFERENCES customers (user_id),
    apartment_id    INT NOT NULL REFERENCES apartments (apartment_id),
    cro_id          INT REFERENCES cros (user_id),
    requested_date  DATETIME NOT NULL,
    scheduled_date  DATETIME,
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    decline_reason  VARCHAR(500),
    created_at      DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME NOT NULL DEFAULT GETDATE(),
    CHECK (status IN ('PENDING', 'APPROVED', 'RESCHEDULED', 'DECLINED', 'COMPLETED', 'CANCELLED')),
    CHECK (status <> 'DECLINED' OR decline_reason IS NOT NULL)
);


-- ============ Inquiries ============

CREATE TABLE inquiries (
    inquiry_id    INT PRIMARY KEY,
    customer_id   INT NOT NULL REFERENCES customers (user_id),
    apartment_id  INT NOT NULL REFERENCES apartments (apartment_id),
    cro_id        INT REFERENCES cros (user_id),
    question      VARCHAR(2000) NOT NULL,
    staff_reply   VARCHAR(2000),
    status        VARCHAR(30) NOT NULL DEFAULT 'NEW',
    created_date  DATETIME NOT NULL DEFAULT GETDATE(),
    CHECK (status IN ('NEW', 'IN_PROGRESS', 'RESPONDED', 'CLOSED')),
    -- a responded inquiry must have a reply
    CHECK (status <> 'RESPONDED' OR staff_reply IS NOT NULL)
);


-- ============ Notifications ============

CREATE TABLE notifications (
    id                   INT PRIMARY KEY,
    user_id              INT NOT NULL REFERENCES users (user_id),
    type                 VARCHAR(30) NOT NULL,
    message              VARCHAR(500) NOT NULL,
    reason               VARCHAR(1000),
    related_entity_type  VARCHAR(30) NOT NULL,
    related_entity_id    INT,
    entity_title         VARCHAR(255),
    is_read              BIT NOT NULL DEFAULT 0,
    sent_date            DATETIME NOT NULL DEFAULT GETDATE(),
    CHECK (type IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'RESPONDED',
                    'REQUESTED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED')),
    CHECK (related_entity_type IN ('APARTMENT', 'PROMOTION', 'RESERVATION',
                                   'APPOINTMENT', 'INQUIRY'))
);
GO
