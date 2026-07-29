'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { LogOut, ChevronDown, User as UserIcon, Users, UserCheck } from 'lucide-react';
import { TeamManagerModal } from './TeamManagerModal';
import { TeamListModal } from './TeamListModal';

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamListOpen, setTeamListOpen] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    let globalChannel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        globalChannel = supabase.channel('global_presence', {
          config: { presence: { key: data.user.id } }
        });

        globalChannel
          .on('presence', { event: 'sync' }, () => {
            const state = globalChannel!.presenceState();
            const onlineIds = Object.keys(state);
            setOnlineUserIds(onlineIds);
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await globalChannel!.track({ online_at: new Date().toISOString() });
            }
          });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
      if (globalChannel) {
        supabase.removeChannel(globalChannel);
      }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (!user) return null;

  const fullName: string = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User';
  const role: string = user.user_metadata?.role ?? 'Team Member';
  const avatarUrl: string | null = user.user_metadata?.avatar_url ?? null;

  // Generate initials for avatar fallback
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 transition-all group"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-zinc-700 border border-zinc-600 shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-zinc-200">{initials}</span>
          )}
        </div>

        {/* Info */}
        <div className="text-left hidden sm:block">
          <p className="text-xs font-medium text-zinc-200 leading-tight">{fullName}</p>
          <p className="text-[10px] text-zinc-500 leading-tight">{role}</p>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-all ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl shadow-black/50 z-50 overflow-hidden">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-zinc-700 border border-zinc-600 shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-zinc-200">{initials}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{fullName}</p>
                  <p className="text-xs text-zinc-500">{role}</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 mt-2 truncate">{user.email}</p>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  setTeamListOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors mb-1"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-1 items-center justify-between">
                  <span>Daftar Tim</span>
                  <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {onlineUserIds.length} Online
                  </span>
                </div>
              </button>

              {user.email === 'adm.gadingprinting@gmail.com' && (
                <button
                  onClick={() => {
                    setOpen(false);
                    setTeamModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors mb-1"
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  Kelola Tim
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar (Logout)
              </button>
            </div>
          </div>
        </>
      )}

      <TeamManagerModal open={teamModalOpen} onOpenChange={setTeamModalOpen} />
      <TeamListModal open={teamListOpen} onOpenChange={setTeamListOpen} onlineUserIds={onlineUserIds} />
    </div>
  );
}
