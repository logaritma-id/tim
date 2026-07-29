'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { BriefcaseBusiness, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email atau password salah. Coba lagi.');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setError('Gagal mengirim magic link. Coba lagi.');
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      {/* Background subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="relative w-full max-w-sm">
        {/* Logo & Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-zinc-800/60 rounded-2xl border border-zinc-700/50 mb-4 shadow-xl shadow-black/40">
            <BriefcaseBusiness className="w-7 h-7 text-zinc-200" />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">Logaritma Project Hub</h1>
          <p className="text-zinc-500 text-sm mt-1.5">Masuk untuk mengelola proyek tim Anda</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-2xl shadow-black/50 backdrop-blur-sm">
          {magicLinkSent ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-zinc-50 font-semibold text-lg">Cek Inbox Anda!</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Kami mengirimkan <strong>magic link</strong> ke <strong>{email}</strong>. 
                Klik link tersebut untuk masuk secara otomatis.
              </p>
              <button
                onClick={() => setMagicLinkSent(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
              >
                ← Kembali ke form login
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@logaritma.id"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-800/60 border border-zinc-700/60 rounded-xl text-zinc-100 text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-xl text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-black/20 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Masuk...' : 'Masuk ke Dashboard'}
              </button>

              {/* Divider */}
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-zinc-900/60 px-2 text-zinc-500">atau</span>
                </div>
              </div>

              {/* Magic Link */}
              <button
                type="button"
                onClick={handleMagicLink}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 hover:text-zinc-100 font-medium rounded-xl text-sm transition-all disabled:opacity-60"
              >
                <Mail className="w-4 h-4" />
                Kirim Magic Link ke Email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          Logaritma Project Hub · Internal Team Tools
        </p>
      </div>
    </main>
  );
}
