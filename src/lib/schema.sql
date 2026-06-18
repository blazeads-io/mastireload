-- Run this once to set up the DB schema

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  mobile      VARCHAR(15) NOT NULL UNIQUE,
  country_code VARCHAR(5) NOT NULL DEFAULT '91',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otps (
  id         SERIAL PRIMARY KEY,
  mobile     VARCHAR(15) NOT NULL,
  otp        VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_otps_mobile ON otps(mobile);

CREATE TABLE IF NOT EXISTS plans (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  original_price INTEGER NOT NULL,
  price          INTEGER NOT NULL,
  duration_days  INTEGER NOT NULL,
  description    TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plans (name, original_price, price, duration_days, description) VALUES
  ('Monthly', 349, 199, 30, 'Poora mahine ka mazza')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  plan_id     INTEGER NOT NULL REFERENCES plans(id),
  start_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date    TIMESTAMPTZ NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | expired | cancelled
  payment_id  INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_user ON subscriptions(user_id);

CREATE TABLE IF NOT EXISTS payments (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  plan_id           INTEGER NOT NULL REFERENCES plans(id),
  txn_id            VARCHAR(100) NOT NULL UNIQUE,
  amount            INTEGER NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | success | failed
  gateway_txn_id   VARCHAR(200),
  gateway_response JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pay_txn ON payments(txn_id);
CREATE INDEX IF NOT EXISTS idx_pay_user ON payments(user_id);

-- ── Marketing / Pixel tracking ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS pixels (
  id            SERIAL PRIMARY KEY,
  slug          VARCHAR(50)  NOT NULL UNIQUE,
  label         VARCHAR(100) NOT NULL,
  pixel_id      VARCHAR(20)  NOT NULL,
  access_token  TEXT         NOT NULL,
  ad_account_id VARCHAR(30),
  is_default    BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- Only one pixel can be default at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_pixels_one_default ON pixels(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_pixels_slug ON pixels(slug);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS campaign_slug       VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS capi_sent           BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS capi_error          TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS meta_campaign_id    VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS meta_campaign_name  VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fbp                 VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fbc                 VARCHAR(200);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gp_intent_id        VARCHAR(200);
ALTER TABLE payments RENAME COLUMN IF EXISTS easebuzz_txn_id TO gateway_txn_id;
ALTER TABLE payments RENAME COLUMN IF EXISTS easebuzz_response TO gateway_response;
