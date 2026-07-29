-- =============================================
-- Project Hub v1.5 - Database Migration
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Buat tabel untuk menyimpan token undangan (Invites)
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS Policies
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Hanya izinkan service role atau operasi internal yang menggunakan bypass RLS,
-- tapi jika butuh dibaca oleh admin dari client:
CREATE POLICY "Admin dapat mengelola invites" 
  ON team_invites 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt()->>'email' = 'adm.gadingprinting@gmail.com');
