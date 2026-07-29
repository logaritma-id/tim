-- =============================================
-- Project Hub v1.3 - Database Migration
-- Jalankan di Supabase SQL Editor
-- =============================================

-- 1. Update tabel project_comments: tambah kolom user_id & user_avatar
ALTER TABLE project_comments 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- Rename sender_name -> user_name jika belum dilakukan
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'project_comments' AND column_name = 'sender_name'
  ) THEN
    ALTER TABLE project_comments RENAME COLUMN sender_name TO user_name;
  END IF;
END $$;

-- 2. Update RLS policies untuk semua tabel agar hanya user terauthentikasi
-- Projects
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert access for all users" ON projects;
DROP POLICY IF EXISTS "Enable update access for all users" ON projects;
DROP POLICY IF EXISTS "Enable delete access for all users" ON projects;

CREATE POLICY "Authenticated read projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert projects" ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update projects" ON projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete projects" ON projects FOR DELETE TO authenticated USING (true);

-- Project Tasks
DROP POLICY IF EXISTS "Enable read access for all users" ON project_tasks;
DROP POLICY IF EXISTS "Enable insert access for all users" ON project_tasks;
DROP POLICY IF EXISTS "Enable update access for all users" ON project_tasks;
DROP POLICY IF EXISTS "Enable delete access for all users" ON project_tasks;

CREATE POLICY "Authenticated read tasks" ON project_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert tasks" ON project_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update tasks" ON project_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete tasks" ON project_tasks FOR DELETE TO authenticated USING (true);

-- Activity Logs
DROP POLICY IF EXISTS "Enable read access for all users" ON activity_logs;
DROP POLICY IF EXISTS "Enable insert access for all users" ON activity_logs;
DROP POLICY IF EXISTS "Enable update access for all users" ON activity_logs;
DROP POLICY IF EXISTS "Enable delete access for all users" ON activity_logs;

CREATE POLICY "Authenticated read logs" ON activity_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert logs" ON activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update logs" ON activity_logs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated delete logs" ON activity_logs FOR DELETE TO authenticated USING (true);

-- Project Comments
DROP POLICY IF EXISTS "Enable read access for all users" ON project_comments;
DROP POLICY IF EXISTS "Enable insert access for all users" ON project_comments;
DROP POLICY IF EXISTS "Enable update access for all users" ON project_comments;
DROP POLICY IF EXISTS "Enable delete access for all users" ON project_comments;
DROP POLICY IF EXISTS "read all" ON project_comments;
DROP POLICY IF EXISTS "insert all" ON project_comments;
DROP POLICY IF EXISTS "delete all" ON project_comments;

CREATE POLICY "Authenticated read comments" ON project_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert comments" ON project_comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated delete comments" ON project_comments FOR DELETE TO authenticated USING (true);
