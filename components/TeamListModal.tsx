'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Users, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onlineUserIds: string[];
}

export function TeamListModal({ open, onOpenChange, onlineUserIds }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      fetchProfiles();
    }
  }, [open]);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error(error);
      toast.error('Gagal mengambil daftar tim. Pastikan SQL v1.6 sudah dijalankan.');
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const filteredProfiles = profiles.filter(p => {
    const term = search.toLowerCase();
    const nameMatch = (p.full_name || '').toLowerCase().includes(term);
    const emailMatch = (p.email || '').toLowerCase().includes(term);
    return nameMatch || emailMatch;
  });

  // Urutkan: Online di atas, lalu berdasarkan nama
  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    const isAOnline = onlineUserIds.includes(a.id) ? 1 : 0;
    const isBOnline = onlineUserIds.includes(b.id) ? 1 : 0;
    
    if (isAOnline !== isBOnline) {
      return isBOnline - isAOnline; // Online prioritas
    }
    
    const nameA = (a.full_name || a.email).toLowerCase();
    const nameB = (b.full_name || b.email).toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Daftar Tim
              </div>
              <div className="text-xs font-medium text-zinc-400 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                <span className="text-emerald-400 font-bold">{onlineUserIds.length}</span> Online
              </div>
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Lihat siapa saja yang terdaftar dan sedang aktif saat ini.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email..."
              className="pl-9 bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-zinc-700"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : sortedProfiles.length === 0 ? (
            <div className="text-center py-8 text-sm text-zinc-500">
              Tidak ada anggota tim yang ditemukan.
            </div>
          ) : (
            <div className="space-y-2">
              {sortedProfiles.map((profile) => {
                const isOnline = onlineUserIds.includes(profile.id);
                const displayName = profile.full_name || profile.email.split('@')[0];
                const initials = displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

                return (
                  <div key={profile.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-900 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-300 border border-zinc-700 overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                        {/* Status Dot */}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-950 ${isOnline ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                      </div>

                      {/* Info */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-zinc-200 truncate">{displayName}</span>
                        <span className="text-[11px] text-zinc-500 truncate">{profile.email}</span>
                      </div>
                    </div>

                    <div className="shrink-0 ml-3">
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-full border ${
                        isOnline 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
