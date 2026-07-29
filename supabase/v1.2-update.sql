-- Skrip Update Database untuk v1.2
-- Jalankan ini di SQL Editor Supabase Anda

CREATE TABLE project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON project_comments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON project_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON project_comments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON project_comments FOR DELETE USING (true);
