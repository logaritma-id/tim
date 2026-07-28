-- Skrip Update Database untuk v1.1
-- Jalankan ini di SQL Editor Supabase Anda

ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain_expiry_date DATE;
