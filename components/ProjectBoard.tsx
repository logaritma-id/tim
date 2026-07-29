'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Project, ProjectStatus } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { GitBranch, Palette, Link as LinkIcon, Calendar, Loader2, ExternalLink, Copy, AlertTriangle, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectDetailDrawer } from './ProjectDetailDrawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_OPTIONS: { label: string; value: ProjectStatus; color: string; progress: number }[] = [
  { label: 'Briefing', value: 'briefing', color: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600', progress: 15 },
  { label: 'Design', value: 'design', color: 'bg-blue-900/50 text-blue-200 hover:bg-blue-800/50 border-blue-800', progress: 35 },
  { label: 'Development', value: 'development', color: 'bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800/50 border-indigo-800', progress: 60 },
  { label: 'Review', value: 'review', color: 'bg-amber-900/40 text-amber-200 hover:bg-amber-800/40 border-amber-800', progress: 85 },
  { label: 'Deployed', value: 'deployed', color: 'bg-teal-900/40 text-teal-200 hover:bg-teal-800/40 border-teal-800', progress: 100 },
  { label: 'Completed', value: 'completed', color: 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-800/50 border-emerald-800', progress: 100 },
];

export function ProjectBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Gagal mengambil data proyek');
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
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus, projectTitle: string, clientWa: string) => {
    const oldProject = projects.find(p => p.id === projectId);
    if (oldProject?.status === newStatus) return;

    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) {
      toast.error('Gagal memperbarui status');
      fetchProjects();
      return;
    }

    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_title: projectTitle,
          status: newStatus,
          client_wa_number: clientWa
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Status diperbarui & Notifikasi WA terkirim ke ${clientWa}`);
      } else {
        toast.error(`Status diperbarui, tetapi gagal mengirim WA: ${data.error || 'Unknown Error'}`);
      }
    } catch (err: any) {
      toast.error(`Status diperbarui, tetapi gagal mengirim pesan WA: ${err.message}`);
    }
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      toast.error('Gagal menghapus project');
      console.error(error);
    } else {
      toast.success(`Project ${projectTitle} berhasil dihapus`);
      // Note: real-time subscription will trigger a re-fetch, but optimistic update is good:
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const copyToClipboard = (e: React.MouseEvent, text: string, type: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`Link ${type} disalin!`);
  };

  const isDomainExpiringSoon = (dateString?: string | null) => {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.project_title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <Tabs defaultValue="all" onValueChange={setFilterStatus} className="w-full sm:w-auto overflow-x-auto">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-xs">Semua</TabsTrigger>
            {STATUS_OPTIONS.map(opt => (
              <TabsTrigger key={opt.value} value={opt.value} className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-xs">
                {opt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Cari project atau klien..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-zinc-900/50 border-zinc-800 text-sm focus-visible:ring-zinc-700 h-9"
            />
          </div>
          <ProjectFormModal onSuccess={fetchProjects} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProjects.map((project) => (
          <ProjectDetailDrawer key={project.id} project={project}>
            <Card className="bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/80 hover:border-zinc-700/80 transition-all shadow-sm flex flex-col h-full rounded-xl group relative text-left">
              <CardHeader className="pb-4 relative">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline" className={`${STATUS_OPTIONS.find(s => s.value === project.status)?.color} border font-medium text-xs rounded-md px-2 py-0.5 shadow-none`}>
                    {STATUS_OPTIONS.find(s => s.value === project.status)?.label}
                  </Badge>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <ProjectFormModal project={project} onSuccess={fetchProjects} />
                    <AlertDialog>
                      <AlertDialogTrigger render={
                        <button className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors" title="Hapus Project">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      } />
                      <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Project Secara Permanen?</AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            Tindakan ini tidak dapat dibatalkan. Project <strong>{project.project_title}</strong> beserta seluruh daftar Task, Log Aktivitas, dan Diskusi Tim di dalamnya akan terhapus.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100">Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-900/80 hover:bg-red-900 text-zinc-100 border border-red-800"
                            onClick={() => handleDeleteProject(project.id, project.project_title)}
                          >
                            Ya, Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-zinc-50 group-hover:text-indigo-400 transition-colors">{project.project_title}</CardTitle>
                  <p className="text-sm font-medium text-zinc-400">{project.client_name}</p>
                </div>
                
                {isDomainExpiringSoon(project.domain_expiry_date) && (
                  <div className="mt-3 inline-flex items-center text-[11px] font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                    <AlertTriangle className="w-3 h-3 mr-1.5" /> Domain Expiry Soon
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-5 flex-grow">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Progress</span>
                    <span className="font-medium">{STATUS_OPTIONS.find(s => s.value === project.status)?.progress || 0}%</span>
                  </div>
                  <Progress value={STATUS_OPTIONS.find(s => s.value === project.status)?.progress || 0} className="h-1.5 bg-zinc-800" />
                </div>

                <div className="flex items-center text-sm text-zinc-400">
                  <Calendar className="mr-2 h-4 w-4 text-zinc-500" />
                  {project.target_deadline ? new Date(project.target_deadline).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}
                </div>
                
                <div className="flex flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {project.figma_url && (
                    <button type="button" onClick={(e) => copyToClipboard(e, project.figma_url!, 'Figma')} className="inline-flex items-center text-xs bg-zinc-800/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50 group/btn">
                      <Palette className="mr-1.5 h-3.5 w-3.5" /> Figma <Copy className="ml-1.5 h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                  )}
                  {project.github_repo_url && (
                    <a href={project.github_repo_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs bg-zinc-800/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50">
                      <GitBranch className="mr-1.5 h-3.5 w-3.5" /> Repo <ExternalLink className="ml-1.5 h-3 w-3 opacity-50" />
                    </a>
                  )}
                  {project.staging_url && (
                    <button type="button" onClick={(e) => copyToClipboard(e, project.staging_url!, 'Staging URL')} className="inline-flex items-center text-xs bg-zinc-800/50 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-700 px-2.5 py-1.5 rounded-md transition-colors border border-zinc-700/50 group/btn">
                      <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Staging <Copy className="ml-1.5 h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-zinc-800/60 bg-zinc-950/20 rounded-b-xl" onClick={(e) => e.stopPropagation()}>
                <div className="w-full flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Ubah Status</span>
                  <Select
                    value={project.status}
                    onValueChange={(val) => handleStatusChange(project.id, val as ProjectStatus, project.project_title, project.client_wa_number)}
                  >
                    <SelectTrigger className="w-full max-w-[160px] bg-zinc-900 border-zinc-700 text-zinc-200 focus:ring-zinc-600 h-8 text-xs rounded-md shadow-sm">
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
          </ProjectDetailDrawer>
        ))}
        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border border-zinc-800/50 border-dashed rounded-xl bg-zinc-900/20">
            <Search className="h-8 w-8 text-zinc-600 mb-3" />
            <h3 className="text-base font-medium text-zinc-300">Project tidak ditemukan</h3>
            <p className="text-sm text-zinc-500 mt-1 text-center">Coba ubah kata kunci pencarian atau tab filter status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
