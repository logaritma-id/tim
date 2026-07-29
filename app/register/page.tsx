'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Mail, KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (!token) {
      toast.error('Token pendaftaran tidak ditemukan.');
      router.push('/login');
    }
  }, [token, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Submit registrasi ke API Server
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftar.');
      }

      toast.success('Pendaftaran berhasil! Mengalihkan...');

      // 2. Otomatis Login setelah berhasil mendaftar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw new Error('Gagal login otomatis, silakan login manual.');
      }

      router.push('/');
      router.refresh();

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
          <CheckCircle2 className="w-6 h-6 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Selamat Bergabung!</h1>
        <p className="text-sm text-zinc-400">
          Anda telah diundang ke Logaritma Project Hub. Lengkapi data di bawah ini untuk membuat akun.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">Nama Lengkap</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Budi Santoso"
              className="pl-9 bg-zinc-950/50 border-zinc-800 text-sm focus-visible:ring-zinc-700"
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
              placeholder="email@anda.com"
              className="pl-9 bg-zinc-950/50 border-zinc-800 text-sm focus-visible:ring-zinc-700"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-300">Buat Password</label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 6 karakter"
              className="pl-9 bg-zinc-950/50 border-zinc-800 text-sm focus-visible:ring-zinc-700"
              required
              minLength={6}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {loading ? 'Memproses...' : 'Daftar & Masuk Dashboard'}
        </Button>
      </form>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="flex items-center gap-2 text-zinc-400"><Loader2 className="w-5 h-5 animate-spin" /> Memuat form pendaftaran...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
