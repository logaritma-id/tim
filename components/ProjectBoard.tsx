'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Project, ProjectStatus } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link as LinkIcon, Calendar, Loader2, GitBranch, Palette } from 'lucide-react';
import { ProjectFormModal } from './ProjectFormModal';

const STATUS_OPTIONS: { label: string; value: ProjectStatus; color: string }[] = [
  { label: 'Briefing', value: 'briefing', color: 'bg-slate-600' },
  { label: 'Design', value: 'design', color: 'bg-purple-600' },
  { label: 'Development', value: 'development', color: 'bg-blue-600' },
  { label: 'Review', value: 'review', color: 'bg-orange-600' },
  { label: 'Deployed', value: 'deployed', color: 'bg-emerald-600' },
  { label: 'Completed', value: 'completed', color: 'bg-green-700' },
];

export function ProjectBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('projects_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Realtime update:', payload);
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus, projectTitle: string, clientWa: string) => {
    // Optimistic UI Update
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) {
      console.error('Failed to update status', error);
      fetchProjects(); // revert
      return;
    }

    // Trigger Fonnte API notification
    try {
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_title: projectTitle,
          status: newStatus,
          client_wa_number: clientWa
        })
      });
    } catch (err) {
      console.error('Failed to trigger notification', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 shadow-sm backdrop-blur-md">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center">
          <span className="w-2 h-8 bg-indigo-500 rounded-full mr-3"></span>
          Daftar Project Aktif
        </h2>
        <ProjectFormModal onSuccess={fetchProjects} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="bg-zinc-900/60 border-zinc-800/60 backdrop-blur-xl hover:border-zinc-700/80 hover:shadow-indigo-900/10 transition-all duration-300 shadow-xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <CardHeader className="pb-3 relative z-10">
              <div className="flex justify-between items-start mb-3">
                <Badge className={`${STATUS_OPTIONS.find(s => s.value === project.status)?.color} text-white border-none shadow-sm`}>
                  {STATUS_OPTIONS.find(s => s.value === project.status)?.label}
                </Badge>
                <ProjectFormModal project={project} onSuccess={fetchProjects} />
              </div>
              <CardTitle className="text-xl font-bold text-zinc-50">{project.project_title}</CardTitle>
              <p className="text-sm font-medium text-indigo-400/80">{project.client_name}</p>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex items-center text-sm text-zinc-400 bg-zinc-950/50 w-max px-3 py-1.5 rounded-lg border border-zinc-800/50">
                <Calendar className="mr-2 h-4 w-4 text-zinc-500" />
                {project.target_deadline ? new Date(project.target_deadline).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Deadline belum diset'}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {project.figma_url && (
                  <a href={project.figma_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50">
                    <Palette className="mr-1.5 h-3.5 w-3.5" /> Figma
                  </a>
                )}
                {project.github_repo_url && (
                  <a href={project.github_repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50">
                    <GitBranch className="mr-1.5 h-3.5 w-3.5" /> Repo
                  </a>
                )}
                {project.staging_url && (
                  <a href={project.staging_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50">
                    <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Staging
                  </a>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-4 border-t border-zinc-800/50 bg-zinc-950/40 relative z-10">
              <div className="w-full">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-semibold">Update Status & Notif WA</p>
                <Select
                  value={project.status}
                  onValueChange={(val) => handleStatusChange(project.id, val as ProjectStatus, project.project_title, project.client_wa_number)}
                >
                  <SelectTrigger className="w-full bg-zinc-900 border-zinc-700 text-zinc-200 focus:ring-indigo-500 h-9">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-zinc-800">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${opt.color}`}></span>
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardFooter>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-zinc-900/30 rounded-xl border border-zinc-800/50 border-dashed">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300">Belum ada Project</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-sm text-center">Tambahkan project pertama Anda untuk mulai memantau progress development.</p>
          </div>
        )}
      </div>
    </div>
  );
}
