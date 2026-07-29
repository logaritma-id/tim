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
import { Loader2, Phone, Send, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamManagerModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    
    setLoading(true);

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim undangan');
      }

      toast.success('Undangan WhatsApp berhasil dikirim!');
      setPhone('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            Undang Anggota Tim
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Sistem akan otomatis mengirimkan link pendaftaran rahasia via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300">Nomor WhatsApp Calon Tim</label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081234567890"
                className="pl-9 bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-zinc-700"
                required
              />
            </div>
            <p className="text-[10px] text-zinc-500">
              Gunakan format 08 atau 62. Pesan akan dikirim melalui Fonnte.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !phone}
            className="w-full bg-[#25D366] hover:bg-[#20b858] text-white mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {loading ? 'Mengirim...' : 'Kirim Undangan WA'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
