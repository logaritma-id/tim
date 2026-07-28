-- ENUM Types
CREATE TYPE project_status AS ENUM ('briefing', 'design', 'development', 'review', 'deployed', 'completed');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'qa_review', 'done');

-- Tabel projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  status project_status DEFAULT 'briefing',
  staging_url TEXT,
  production_url TEXT,
  figma_url TEXT,
  github_repo_url TEXT,
  client_wa_number TEXT NOT NULL,
  target_deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabel project_tasks
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  task_name TEXT,
  assigned_to TEXT,
  status task_status DEFAULT 'todo',
  due_date DATE
);

-- Tabel activity_logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  updated_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (Public access for MVP development)
-- JANGAN LUPA UNTUK MENGGANTI POLICY INI DI PRODUKSI JIKA DIBUTUHKAN AUTENTIKASI
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON project_tasks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON project_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON project_tasks FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON project_tasks FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON activity_logs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON activity_logs FOR DELETE USING (true);

-- Trigger Auto Update updated_at
CREATE OR REPLACE FUNCTION update_modified_column()   
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_modtime 
BEFORE UPDATE ON projects 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
