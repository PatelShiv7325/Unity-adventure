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
  participants   INT DEFAULT 1,
  amount         DECIMAL(10,2) NOT NULL,
  coupon_id      INT REFERENCES coupons(id),
  payment_status VARCHAR(20) DEFAULT 'pending',   -- pending | paid | failed | refunded
  payment_ref    VARCHAR(120),
  status         VARCHAR(20) DEFAULT 'confirmed', -- confirmed | cancelled | completed
  ticket_code    VARCHAR(40) UNIQUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL REFERENCES users(id),
  activity_id INT NOT NULL REFERENCES activities(id),
  rating      INT NOT NULL,
  comment     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
