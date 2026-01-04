-- =========================
-- BRANCHES
-- =========================
INSERT INTO branches (name, address) VALUES
('Numars Pondok Indah', 'Jakarta Selatan'),
('Numars Sentul', 'Bogor');

-- =========================
-- ROLES
-- =========================
INSERT INTO roles (name) VALUES
('Owner'),
('Manager'),
('Supervisor'),
('Kasir'),
('Terapis'),
('Staff Bar');

-- =========================
-- USERS (password harus HASH bcrypt)
-- =========================
INSERT INTO users (branch_id, role_id, name, phone, password)
VALUES
(1, 1, 'Owner Numars', '0811111111', 'PASTE_HASH_DI_SINI'),
(1, 4, 'Kasir Pondok Indah', '0812222222', 'PASTE_HASH_DI_SINI'),
(2, 4, 'Kasir Sentul', '0813333333', 'PASTE_HASH_DI_SINI');

-- =========================
-- THERAPIST GRADES
-- =========================
INSERT INTO therapist_grades (name, commission_percent) VALUES
('Pink', 30),
('Gold', 35),
('Platinum', 40);

-- =========================
-- THERAPISTS
-- =========================
INSERT INTO therapists (branch_id, grade_id, name) VALUES
(1, 2, 'Ayu'),
(1, 3, 'Nina'),
(2, 1, 'Sari');

-- =========================
-- SERVICES
-- =========================
INSERT INTO services (branch_id, name, category, price, duration_minutes) VALUES
(1, 'Spa Relax 60 Menit', 'spa', 300000, 60),
(1, 'Karaoke 3 Jam', 'karaoke', 500000, 180),
(1, 'Lounge No Limit', 'lounge', 250000, 0);

-- =========================
-- FNB ITEMS
-- =========================
INSERT INTO fnb_items (branch_id, name, price, stock, alert_stock) VALUES
(1, 'Beer', 80000, 50, 10),
(1, 'Cocktail', 120000, 30, 5);
