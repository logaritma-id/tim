'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Project, ProjectStatus } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitBranch, Palette, Link as LinkIcon, Calendar, Loader2, ExternalLink } from 'lucide-react';
import { ProjectFormModal } from './ProjectFormModal';

const STATUS_OPTIONS: { label: string; value: ProjectStatus; color: string }[] = [
  { label: 'Briefing', value: 'briefing', color: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600' },
  { label: 'Design', value: 'design', color: 'bg-blue-900/50 text-blue-200 hover:bg-blue-800/50 border-blue-800' },
  { label: 'Development', value: 'development', color: 'bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800/50 border-indigo-800' },
  { label: 'Review', value: 'review', color: 'bg-amber-900/40 text-amber-200 hover:bg-amber-800/40 border-amber-800' },
  { label: 'Deployed', value: 'deployed', color: 'bg-teal-900/40 text-teal-200 hover:bg-teal-800/40 border-teal-800' },
  { label: 'Completed', value: 'completed', color: 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800/50 border-emerald-800' },
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
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus, projectTitle: string, clientWa: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) {
      console.error('Failed to update status', error);
      fetchProjects();
      return;
    }

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
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2">
        <h2 className="text-xl font-medium tracking-tight text-zinc-100 flex items-center">
          Daftar Project
        </h2>
        <ProjectFormModal onSuccess={fetchProjects} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project) => (
          <Card key={project.id} className="bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 transition-colors shadow-sm flex flex-col h-full rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className={`${STATUS_OPTIONS.find(s => s.value === project.status)?.color} border font-medium text-xs rounded-md px-2 py-0.5 shadow-none`}>
                  {STATUS_OPTIONS.find(s => s.value === project.status)?.label}
                </Badge>
                <ProjectFormModal project={project} onSuccess={fetchProjects} />
              </div>
              <CardTitle className="text-lg font-semibold text-zinc-50">{project.project_title}</CardTitle>
              <p className="text-sm font-medium text-zinc-400 mt-1">{project.client_name}</p>
            </CardHeader>
            
            <CardContent className="space-y-5 flex-grow">
              <div className="flex items-center text-sm text-zinc-400">
                <Calendar className="mr-2 h-4 w-4 text-zinc-500" />
                {project.target_deadline ? new Date(project.target_deadline).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {project.figma_url && (
                  <a href={project.figma_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs bg-zinc-800/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50">
                    <Palette className="mr-1.5 h-3.5 w-3.5" /> Figma <ExternalLink className="ml-1.5 h-3 w-3 opacity-50" />
                  </a>
                )}
                {project.github_repo_url && (
                  <a href={project.github_repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs bg-zinc-800/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50">
                    <GitBranch className="mr-1.5 h-3.5 w-3.5" /> Repo <ExternalLink className="ml-1.5 h-3 w-3 opacity-50" />
                  </a>
                )}
                {project.staging_url && (
                  <a href={project.staging_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs bg-zinc-800/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50">
                    <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Staging <ExternalLink className="ml-1.5 h-3 w-3 opacity-50" />
                  </a>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 border-t border-zinc-800/60 bg-zinc-950/20 rounded-b-xl">
              <div className="w-full flex items-center justify-between gap-3">
                <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Ubah Status</span>
                <Select
                  value={project.status}
                  onValueChange={(val) => handleStatusChange(project.id, val as ProjectStatus, project.project_title, project.client_wa_number)}
                >
                  <SelectTrigger className="w-full max-w-[180px] bg-zinc-900 border-zinc-700 text-zinc-200 focus:ring-zinc-600 h-8 text-xs rounded-md shadow-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="focus:bg-zinc-800 text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardFooter>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border border-zinc-800/50 border-dashed rounded-xl">
            <Calendar className="h-8 w-8 text-zinc-600 mb-3" />
            <h3 className="text-base font-medium text-zinc-300">Belum ada Project</h3>
            <p className="text-sm text-zinc-500 mt-1">Tambahkan project baru untuk memulai pemantauan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
