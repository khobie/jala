-- Tables only (for cloud MySQL where the database is pre-created).
-- Used by: npm run db:migrate

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  phone         VARCHAR(20)  NOT NULL,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('client','artisan','admin') NOT NULL DEFAULT 'client',
  is_phone_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  avatar_url    VARCHAR(500) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_phone (phone)
) ENGINE=InnoDB;

-- ---------- Artisan profiles ----------
CREATE TABLE IF NOT EXISTS artisans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  trade         VARCHAR(80) NOT NULL,
  experience    INT NOT NULL DEFAULT 0,
  location      VARCHAR(160) NOT NULL,
  latitude      DECIMAL(10,7) DEFAULT NULL,
  longitude     DECIMAL(10,7) DEFAULT NULL,
  bio           TEXT,
  hourly_rate   DECIMAL(10,2) DEFAULT NULL,
  rating        DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count  INT NOT NULL DEFAULT 0,
  jobs_completed INT NOT NULL DEFAULT 0,
  availability  ENUM('available','busy','offline') NOT NULL DEFAULT 'available',
  is_approved   TINYINT(1) NOT NULL DEFAULT 0,
  whatsapp      VARCHAR(20) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_artisan_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_artisan_user (user_id),
  INDEX idx_artisan_trade (trade),
  INDEX idx_artisan_location (location),
  INDEX idx_artisan_rating (rating),
  INDEX idx_artisan_availability (availability)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS portfolio_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  artisan_id  INT NOT NULL,
  image_url   VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) DEFAULT NULL,
  kind        ENUM('before','after','general') NOT NULL DEFAULT 'general',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_portfolio_artisan FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE CASCADE,
  INDEX idx_portfolio_artisan (artisan_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS services (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  artisan_id    INT NOT NULL,
  service_name  VARCHAR(120) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) DEFAULT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_artisan FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE CASCADE,
  INDEX idx_service_artisan (artisan_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  client_id     INT NOT NULL,
  artisan_id    INT NOT NULL,
  service_id    INT DEFAULT NULL,
  booking_date  DATE NOT NULL,
  booking_time  TIME DEFAULT NULL,
  description   TEXT,
  address       VARCHAR(255) DEFAULT NULL,
  status        ENUM('pending','accepted','rejected','completed','cancelled')
                NOT NULL DEFAULT 'pending',
  amount        DECIMAL(10,2) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_client  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_booking_artisan FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  INDEX idx_booking_client (client_id),
  INDEX idx_booking_artisan (artisan_id),
  INDEX idx_booking_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL,
  client_id   INT NOT NULL,
  artisan_id  INT NOT NULL,
  rating      TINYINT NOT NULL,
  comment     TEXT,
  is_hidden   TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_client  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_review_artisan FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE CASCADE,
  UNIQUE KEY uq_review_booking (booking_id),
  INDEX idx_review_artisan (artisan_id),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  booking_id    INT NOT NULL,
  client_id     INT NOT NULL,
  reference     VARCHAR(120) NOT NULL UNIQUE,
  amount        DECIMAL(10,2) NOT NULL,
  channel       VARCHAR(40) DEFAULT NULL,
  provider      VARCHAR(40) NOT NULL DEFAULT 'paystack',
  status        ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_client  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_payment_reference (reference)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(160) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(40) DEFAULT 'general',
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (is_read)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS otp_codes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  purpose     ENUM('phone_verify','password_reset') NOT NULL,
  expires_at  DATETIME NOT NULL,
  consumed    TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_otp_user (user_id),
  INDEX idx_otp_purpose (purpose)
) ENGINE=InnoDB;
