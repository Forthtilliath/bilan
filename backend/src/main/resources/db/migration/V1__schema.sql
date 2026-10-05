CREATE TABLE accounts (
    id              UUID PRIMARY KEY,
    name            VARCHAR(80)   NOT NULL,
    type            VARCHAR(20)   NOT NULL,
    institution     VARCHAR(80),
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    opened_on       DATE          NOT NULL,
    color           SMALLINT      NOT NULL CHECK (color BETWEEN 1 AND 8),
    archived        BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL
);

CREATE TABLE categories (
    id             UUID PRIMARY KEY,
    name           VARCHAR(60)    NOT NULL,
    kind           VARCHAR(10)    NOT NULL,
    color          SMALLINT       NOT NULL CHECK (color BETWEEN 1 AND 8),
    icon           VARCHAR(20),
    monthly_budget NUMERIC(12, 2) CHECK (monthly_budget > 0),
    UNIQUE (kind, name)
);

-- Montant signe : positif = entree d'argent, negatif = sortie.
-- Un virement = deux lignes (une par compte) partageant le meme transfer_id, sans categorie.
CREATE TABLE transactions (
    id          UUID PRIMARY KEY,
    account_id  UUID           NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    category_id UUID           REFERENCES categories (id) ON DELETE SET NULL,
    booked_on   DATE           NOT NULL,
    amount      NUMERIC(14, 2) NOT NULL CHECK (amount <> 0),
    label       VARCHAR(140)   NOT NULL,
    note        VARCHAR(500),
    transfer_id UUID,
    created_at  TIMESTAMPTZ    NOT NULL
);

CREATE INDEX idx_transactions_account ON transactions (account_id, booked_on DESC);
CREATE INDEX idx_transactions_booked ON transactions (booked_on DESC, created_at DESC);
CREATE INDEX idx_transactions_transfer ON transactions (transfer_id) WHERE transfer_id IS NOT NULL;

CREATE TABLE assets (
    id          UUID PRIMARY KEY,
    symbol      VARCHAR(12) NOT NULL UNIQUE,
    name        VARCHAR(80) NOT NULL,
    asset_class VARCHAR(20) NOT NULL
);

CREATE TABLE asset_prices (
    asset_id  UUID           NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
    priced_on DATE           NOT NULL,
    close     NUMERIC(16, 4) NOT NULL CHECK (close > 0),
    PRIMARY KEY (asset_id, priced_on)
);

CREATE TABLE trades (
    id         UUID PRIMARY KEY,
    account_id UUID           NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    asset_id   UUID           NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
    side       VARCHAR(4)     NOT NULL,
    traded_on  DATE           NOT NULL,
    quantity   NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
    price      NUMERIC(16, 4) NOT NULL CHECK (price > 0),
    fees       NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (fees >= 0),
    created_at TIMESTAMPTZ    NOT NULL
);

CREATE INDEX idx_trades_account ON trades (account_id, traded_on);
CREATE INDEX idx_trades_asset ON trades (asset_id, traded_on);
