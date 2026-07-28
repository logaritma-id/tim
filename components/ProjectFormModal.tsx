'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Project } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { Plus } from 'lucide-react';

interface ProjectFormModalProps {
  onSuccess?: () => void;
  project?: Project;
}

export function ProjectFormModal({ onSuccess, project }: ProjectFormModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    client_name: project?.client_name || '',
    project_title: project?.project_title || '',
    client_wa_number: project?.client_wa_number || '',
    target_deadline: project?.target_deadline || '',
    figma_url: project?.figma_url || '',
    github_repo_url: project?.github_repo_url || '',
    staging_url: project?.staging_url || '',
    production_url: project?.production_url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Format target_deadline for Postgres (empty string -> null)
    const payload = {
      ...formData,
      target_deadline: formData.target_deadline || null,
    };

    try {
      if (project) {
        const { error } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', project.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert([payload]);
        if (error) throw error;
      }
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(`Gagal menyimpan project: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {project ? (
        <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800" onClick={() => setOpen(true)}>Edit</Button>
      ) : (
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Project
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Project Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project_title">Nama Project *</Label>
              <Input id="project_title" name="project_title" value={formData.project_title} onChange={handleChange} required className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" placeholder="E.g. E-Commerce Website" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_name">Nama Klien *</Label>
              <Input id="client_name" name="client_name" value={formData.client_name} onChange={handleChange} required className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" placeholder="E.g. PT Maju Bersama" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_wa_number">No WA Klien *</Label>
              <Input id="client_wa_number" name="client_wa_number" value={formData.client_wa_number} onChange={handleChange} required className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" placeholder="081234567890" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target_deadline">Target Deadline</Label>
              <Input id="target_deadline" type="date" name="target_deadline" value={formData.target_deadline || ''} onChange={handleChange} className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="figma_url">Link Figma</Label>
              <Input id="figma_url" name="figma_url" value={formData.figma_url} onChange={handleChange} className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_repo_url">Link GitHub</Label>
              <Input id="github_repo_url" name="github_repo_url" value={formData.github_repo_url} onChange={handleChange} className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="staging_url">Staging URL</Label>
              <Input id="staging_url" name="staging_url" value={formData.staging_url} onChange={handleChange} className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="production_url">Production URL</Label>
              <Input id="production_url" name="production_url" value={formData.production_url} onChange={handleChange} className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
