-- Reference schema (MySQL 8 / PostgreSQL compatible with small tweaks).
-- The Flask models in backend/app/models create these tables automatically;
-- use this file to review the design or set up the DB by hand.

CREATE TABLE users (
  id            INT PRIMARY KEY AUTO_INCREMENT,   -- PostgreSQL: SERIAL PRIMARY KEY
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255),
  role          VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  title            VARCHAR(150) NOT NULL,
  slug             VARCHAR(160) NOT NULL UNIQUE,
  description      TEXT,
  safety_notes     TEXT,
  price            DECIMAL(10,2) NOT NULL,
  duration_minutes INT DEFAULT 30,
  location         VARCHAR(200),
  latitude         DOUBLE,
  longitude        DOUBLE,
  difficulty       VARCHAR(20) DEFAULT 'Easy',
  image_url        VARCHAR(500),
  is_active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE slots (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  activity_id INT NOT NULL REFERENCES activities(id),
  slot_date   DATE NOT NULL,
  start_time  TIME NOT NULL,
  capacity    INT DEFAULT 6,
  booked      INT DEFAULT 0,
  UNIQUE (activity_id, slot_date, start_time)
);

CREATE TABLE coupons (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  code        VARCHAR(40) NOT NULL UNIQUE,
  percent_off INT DEFAULT 0,
  expires_on  DATE,
  is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE bookings (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  user_id        INT NOT NULL REFERENCES users(id),
  activity_id    INT NOT NULL REFERENCES activities(id),
  slot_id        INT NOT NULL REFERENCES slots(id),
  customer_name  VARCHAR(100) NOT NULL,           -- who is flying
  customer_phone VARCHAR(20)  NOT NULL,
  customer_email VARCHAR(120),
  participants   INT DEFAULT 1,
  amount         DECIMAL(10,2) NOT NULL,
  coupon_id      INT REFERENCES coupons(id),
  discount       DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'pending',   -- pending | verifying | paid | failed | refund_pending | refunded
  payment_ref    VARCHAR(120),
  status         VARCHAR(20) DEFAULT 'pending',   -- pending | confirmed | cancelled | completed
  ticket_code    VARCHAR(40) UNIQUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hold_until     TIMESTAMP,                       -- end of the unpaid seat hold (UTC)
  package        VARCHAR(40),                     -- e.g. "Fly Smart"
  checked_in_at  TIMESTAMP                        -- set when staff scan the ticket
);

CREATE TABLE payments (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  booking_id          INT NOT NULL REFERENCES bookings(id),
  provider            VARCHAR(20) NOT NULL,       -- razorpay | upi | demo
  provider_order_id   VARCHAR(120),
  provider_payment_id VARCHAR(120),
  amount              DECIMAL(10,2) NOT NULL,
  currency            VARCHAR(3) DEFAULT 'INR',
  status              VARCHAR(20) DEFAULT 'created',  -- created | verifying | paid | failed
  transaction_id      VARCHAR(120),
  utr                 VARCHAR(30),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at             TIMESTAMP
);
