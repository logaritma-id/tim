export type ProjectStatus = 'briefing' | 'design' | 'development' | 'review' | 'deployed' | 'completed';
export type TaskStatus = 'todo' | 'in_progress' | 'qa_review' | 'done';

export interface Project {
  id: string;
  client_name: string;
  project_title: string;
  status: ProjectStatus;
  production_url?: string | null;
  admin_url?: string | null;
  member_url?: string | null;
  tutorial_url?: string | null;
  client_wa_number: string;
  target_deadline?: string | null;
  domain_expiry_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  task_name: string;
  assigned_to: string | null;
  status: TaskStatus;
  due_date: string | null;
}

export interface ActivityLog {
  id: string;
  project_id: string;
  updated_by: string;
  notes: string;
  created_at: string;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string | null;
  message: string;
  created_at: string;
}
