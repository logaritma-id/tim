-- =============================================
-- Project Hub v1.7 - Database Migration
-- Penyesuaian Kolom URL Project
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Tambahkan kolom baru
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS admin_url TEXT,
  ADD COLUMN IF NOT EXISTS member_url TEXT,
  ADD COLUMN IF NOT EXISTS tutorial_url TEXT;

-- 2. Hapus kolom lama yang tidak terpakai
-- PERINGATAN: Ini akan menghapus data URL Figma, GitHub, dan Staging secara permanen.
ALTER TABLE projects
  DROP COLUMN IF EXISTS figma_url,
  DROP COLUMN IF EXISTS github_repo_url,
  DROP COLUMN IF EXISTS staging_url;
