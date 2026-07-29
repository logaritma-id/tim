'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    production_url: project?.production_url || '',
    admin_url: project?.admin_url || '',
    member_url: project?.member_url || '',
    tutorial_url: project?.tutorial_url || '',
    domain_expiry_date: project?.domain_expiry_date || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      target_deadline: formData.target_deadline || null,
      domain_expiry_date: formData.domain_expiry_date || null,
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
        <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={() => setOpen(true)}>
          Edit
        </Button>
      ) : (
        <Button className="bg-zinc-100 hover:bg-white text-zinc-900 font-medium h-9 px-4 shadow-sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Project Baru
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-zinc-950 border-zinc-800 text-zinc-100 shadow-xl rounded-xl">
          <DialogHeader className="border-b border-zinc-800/60 pb-4">
            <DialogTitle className="font-semibold text-lg">{project ? 'Edit Project' : 'Buat Project Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="project_title" className="text-zinc-400 text-xs uppercase tracking-wider">Nama Project <span className="text-red-500">*</span></Label>
                <Input id="project_title" name="project_title" value={formData.project_title} onChange={handleChange} required className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9" placeholder="E.g. E-Commerce Website" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name" className="text-zinc-400 text-xs uppercase tracking-wider">Nama Klien <span className="text-red-500">*</span></Label>
                <Input id="client_name" name="client_name" value={formData.client_name} onChange={handleChange} required className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9" placeholder="E.g. PT Maju Bersama" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_wa_number" className="text-zinc-400 text-xs uppercase tracking-wider">No WA Klien <span className="text-red-500">*</span></Label>
                <Input id="client_wa_number" name="client_wa_number" value={formData.client_wa_number} onChange={handleChange} required className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9" placeholder="081234567890" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_deadline" className="text-zinc-400 text-xs uppercase tracking-wider">Target Deadline</Label>
                <Input id="target_deadline" type="date" name="target_deadline" value={formData.target_deadline || ''} onChange={handleChange} className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert opacity-80" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="production_url" className="text-zinc-400 text-xs uppercase tracking-wider">Link Website Utama</Label>
                <Input id="production_url" name="production_url" value={formData.production_url} onChange={handleChange} className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin_url" className="text-zinc-400 text-xs uppercase tracking-wider">Link Admin</Label>
                <Input id="admin_url" name="admin_url" value={formData.admin_url} onChange={handleChange} className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9" placeholder="https://.../wp-admin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member_url" className="text-zinc-400 text-xs uppercase tracking-wider">Link Member Area <span className="text-zinc-600 normal-case tracking-normal">(Opsional)</span></Label>
                <Input id="member_url" name="member_url" value={formData.member_url} onChange={handleChange} className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9" placeholder="https://.../login" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tutorial_url" className="text-zinc-400 text-xs uppercase tracking-wider">Link Tutorial / Penjelasan</Label>
                <Input id="tutorial_url" name="tutorial_url" value={formData.tutorial_url} onChange={handleChange} className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9" placeholder="https://docs.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain_expiry_date" className="text-zinc-400 text-xs uppercase tracking-wider">Domain Expiry</Label>
                <Input id="domain_expiry_date" type="date" name="domain_expiry_date" value={formData.domain_expiry_date || ''} onChange={handleChange} className="bg-zinc-900/50 border-zinc-700/50 focus-visible:ring-zinc-500 h-9 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert opacity-80" />
              </div>
            </div>
            <div className="flex justify-end mt-2 pt-4 border-t border-zinc-800/60 gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-100 h-9">Batal</Button>
              <Button type="submit" disabled={loading} className="bg-zinc-100 hover:bg-white text-zinc-900 font-medium h-9 px-6">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
