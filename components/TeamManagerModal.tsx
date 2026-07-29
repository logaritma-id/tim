'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, UserPlus, Mail, KeyRound, User as UserIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamManagerModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: 'logaritma0726',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan tim');
      }

      toast.success('Anggota tim berhasil ditambahkan!');
      setFormData({ fullName: '', email: '', password: 'logaritma0726' });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppInvite = () => {
    const text = `Halo, saya telah membuatkan akun untuk Anda di *Logaritma Project Hub*.\n\nSilakan isi alamat email Anda di balasan pesan ini agar saya bisa mendaftarkan akun Anda.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            Kelola Tim & Undang
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Daftarkan anggota tim baru untuk memberikan akses ke dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Nama Lengkap</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Misal: Budi Santoso"
                className="pl-9 bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-zinc-700"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@perusahaan.com"
                className="pl-9 bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-zinc-700"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Password Awal</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="logaritma0726"
                className="pl-9 bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-zinc-700"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftarkan Anggota Baru'}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-950 px-2 text-zinc-500">Atau</span>
          </div>
        </div>

        <Button 
          type="button" 
          onClick={sendWhatsAppInvite}
          className="w-full bg-[#25D366] hover:bg-[#20b858] text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Minta Email via WhatsApp
        </Button>
      </DialogContent>
    </Dialog>
  );
}
