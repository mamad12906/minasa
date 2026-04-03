CREATE TABLE IF NOT EXISTS customers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    platform_name   TEXT NOT NULL DEFAULT '',
    full_name       TEXT NOT NULL,
    mother_name     TEXT DEFAULT '',
    phone_number    TEXT DEFAULT '',
    card_number     TEXT DEFAULT '',
    category        TEXT DEFAULT '',
    created_at      TEXT DEFAULT (datetime('now','localtime')),
    updated_at      TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS invoices (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id         INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number      TEXT NOT NULL,
    total_months        INTEGER NOT NULL DEFAULT 1,
    total_amount        REAL NOT NULL DEFAULT 0,
    monthly_deduction   REAL NOT NULL DEFAULT 0,
    creation_date       TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'نشطة',
    created_at          TEXT DEFAULT (datetime('now','localtime')),
    updated_at          TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date    TEXT NOT NULL,
    amount          REAL NOT NULL,
    month_number    INTEGER NOT NULL,
    notes           TEXT DEFAULT '',
    created_at      TEXT DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_card ON customers(card_number);
CREATE INDEX IF NOT EXISTS idx_customers_platform ON customers(platform_name);
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(category);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
