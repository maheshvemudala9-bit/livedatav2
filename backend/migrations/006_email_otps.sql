-- OTP storage used by /api/sendOtp and /api/verifyOtp (db.saveOtp / db.verifyOtp).
-- email must be UNIQUE because saveOtp uses ON CONFLICT (email).
CREATE TABLE IF NOT EXISTS email_otps (
  email      VARCHAR(255) PRIMARY KEY,
  otp        VARCHAR(10)  NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  verified   BOOLEAN      NOT NULL DEFAULT false
);
