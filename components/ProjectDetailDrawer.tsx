'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User, RealtimeChannel } from '@supabase/supabase-js';
import { Project, ProjectTask, ActivityLog, ProjectComment } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, ListTodo, Activity, Clock, Maximize2, Minimize2, Trash2, Send, MessageSquare, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PresenceUser {
  user_id: string;
  user_name: string;
  online_at: string;
}

interface Props {
  project: Project;
  children: React.ReactNode;
}

export function ProjectDetailDrawer({ project, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newLogNotes, setNewLogNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  // Get current user from Supabase Auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Anggota Tim';
  const userAvatar = user?.user_metadata?.avatar_url ?? null;
  const userInitials = userName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  const fetchData = async () => {
    setLoading(true);
    const { data: tData } = await supabase.from('project_tasks').select('*').eq('project_id', project.id).order('id', { ascending: true });
    if (tData) setTasks(tData);
    
    const { data: lData } = await supabase.from('activity_logs').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    if (lData) setLogs(lData);
    
    const { data: cData } = await supabase.from('project_comments').select('*').eq('project_id', project.id).order('created_at', { ascending: true });
    if (cData) setComments(cData);
    
    setLoading(false);
  };

  useEffect(() => {
    if (!open || !user) return;

    fetchData();

    // Realtime: listen for new comments
    const commentsChannel = supabase
      .channel(`comments_${project.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'project_comments', filter: `project_id=eq.${project.id}` },
        (payload) => {
          setComments(prev => {
            if (prev.some(c => c.id === (payload.new as ProjectComment).id)) return prev;
            return [...prev, payload.new as ProjectComment];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'project_comments' },
        (payload) => {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      )
      .subscribe();

    // Realtime Presence: track who's online in this project
    const presenceChannel = supabase.channel(`presence_${project.id}`, {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            user_name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(commentsChannel);
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [open, project.id, user]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const { data, error } = await supabase.from('project_tasks').insert([{
      project_id: project.id,
      task_name: newTaskName,
      status: 'todo'
    }]).select();
    if (error) toast.error('Gagal menambahkan task');
    else if (data) { setTasks([...tasks, data[0]]); setNewTaskName(''); }
  };

  const toggleTask = async (task: ProjectTask) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('project_tasks').update({ status: newStatus }).eq('id', task.id);
    if (error) { toast.error('Gagal mengupdate task'); fetchData(); }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('project_tasks').delete().eq('id', taskId);
    if (error) toast.error('Gagal menghapus task');
    else setTasks(tasks.filter(t => t.id !== taskId));
  };

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNotes.trim()) return;
    const { data, error } = await supabase.from('activity_logs').insert([{
      project_id: project.id,
      notes: newLogNotes,
      updated_by: userName
    }]).select();
    if (error) toast.error('Gagal menambahkan log');
    else if (data) { setLogs([data[0], ...logs]); setNewLogNotes(''); }
  };

  const deleteLog = async (logId: string) => {
    const { error } = await supabase.from('activity_logs').delete().eq('id', logId);
    if (error) toast.error('Gagal menghapus log');
    else setLogs(logs.filter(l => l.id !== logId));
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    const messageText = newComment;
    setNewComment('');

    // Optimistic Update (Tampilkan langsung di UI sebelum server merespon)
    const optimisticComment: ProjectComment = {
      id: crypto.randomUUID(), // ID sementara
      project_id: project.id,
      user_id: user.id,
      user_name: userName,
      user_avatar: userAvatar,
      message: messageText,
      created_at: new Date().toISOString()
    };
    
    setComments(prev => [...prev, optimisticComment]);

    const { error } = await supabase.from('project_comments').insert([{
      project_id: project.id,
      user_id: user.id,
      user_name: userName,
      user_avatar: userAvatar,
      message: messageText
    }]);
    
    if (error) {
      toast.error('Gagal mengirim pesan');
      // Rollback jika gagal
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
    }
  };

  const deleteComment = async (id: string) => {
    // Optimistic Delete
    setComments(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from('project_comments').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus pesan');
      fetchData(); // Rollback jika gagal
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<div className="cursor-pointer">{children}</div>} />
      
      <SheetContent
        style={{
          width: isFullscreen ? '100vw' : '28rem',
          maxWidth: isFullscreen ? '100vw' : '28rem',
        }}
        className="bg-[#09090b] border-zinc-800 text-zinc-100 p-0 flex flex-col transition-[width,max-width] duration-300 ease-in-out"
      >
        {/* Fullscreen Toggle */}
        <div className="absolute right-12 top-3 z-50">
          <Button 
            variant="ghost" size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        <SheetHeader className="p-6 pb-4 border-b border-zinc-800/60 pr-24">
          <SheetTitle className="text-xl text-zinc-50">{project.project_title}</SheetTitle>
          <SheetDescription className="text-zinc-400">
            Detail progress, log aktivitas, dan ruang kolaborasi untuk klien {project.client_name}.
          </SheetDescription>

          {/* Online Presence Badge */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/50">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Online sekarang:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {onlineUsers.map((u) => (
                  <span key={u.user_id} className="flex items-center gap-1 text-xs text-zinc-300 bg-zinc-800/50 border border-zinc-700/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    {u.user_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SheetHeader>
        
        <Tabs defaultValue="tasks" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-3">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-900/80">
              <TabsTrigger value="tasks" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-xs">
                <ListTodo className="w-3.5 h-3.5 mr-1.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-xs">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> Log
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50 text-xs">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Diskusi
              </TabsTrigger>
            </TabsList>
          </div>

          {loading ? (
            <div className="flex-1 flex justify-center items-center">
              <Loader2 className="animate-spin text-zinc-500 w-6 h-6" />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden relative flex flex-col">
              {/* TASKS */}
              <TabsContent value="tasks" className="h-full p-0 m-0">
                <ScrollArea className="h-full px-6 py-4">
                  <form onSubmit={addTask} className="flex gap-2 mb-6">
                    <Input value={newTaskName} onChange={(e) => setNewTaskName(e.target.value)} placeholder="Tambah task baru..."
                      className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 text-sm" />
                    <Button type="submit" size="icon" className="bg-zinc-100 hover:bg-white text-zinc-900 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </form>
                  <div className="space-y-3 pb-8">
                    {tasks.length === 0 ? (
                      <p className="text-center text-zinc-500 text-sm py-4">Belum ada task.</p>
                    ) : tasks.map(task => (
                      <div key={task.id} className="flex items-start justify-between p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors group">
                        <div className="flex items-start space-x-3">
                          <Checkbox checked={task.status === 'done'} onCheckedChange={() => toggleTask(task)}
                            className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                          <label className={`text-sm font-medium leading-none ${task.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                            {task.task_name}
                          </label>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* LOGS */}
              <TabsContent value="logs" className="h-full p-0 m-0">
                <ScrollArea className="h-full px-6 py-4">
                  <form onSubmit={addLog} className="space-y-3 mb-6">
                    <Textarea value={newLogNotes} onChange={(e) => setNewLogNotes(e.target.value)}
                      placeholder="Tulis update progres hari ini..."
                      className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 min-h-[80px] text-sm resize-none" />
                    <div className="flex items-center gap-3">
                      {/* Current user badge */}
                      <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 shrink-0">
                        <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-200">{userInitials}</div>
                        {userName}
                      </div>
                      <Button type="submit" size="sm" className="flex-1 bg-zinc-100 hover:bg-white text-zinc-900 h-8">Posting Update</Button>
                    </div>
                  </form>
                  <div className="space-y-4 pb-8">
                    {logs.length === 0 ? (
                      <p className="text-center text-zinc-500 text-sm py-4">Belum ada log aktivitas.</p>
                    ) : logs.map(log => (
                      <div key={log.id} className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 relative group/log">
                        <button onClick={() => deleteLog(log.id)} className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 opacity-0 group-hover/log:opacity-100 transition-opacity">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center justify-between mb-2 pr-6">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300 border border-zinc-600">
                              {log.updated_by?.split(' ').map((n:string) => n[0]).slice(0,2).join('').toUpperCase() || '?'}
                            </div>
                            <h4 className="font-semibold text-zinc-200 text-sm">{log.updated_by}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <time className="text-[10px] font-medium">
                              {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                            </time>
                          </div>
                        </div>
                        <p className="text-zinc-400 text-sm pl-8">{log.notes}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* CHAT/DISCUSSION */}
              <TabsContent value="chat" className="h-full p-0 m-0 flex flex-col min-h-0 data-[state=inactive]:hidden">
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="space-y-4 pb-4">
                    {comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-zinc-500">
                        <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Belum ada diskusi untuk project ini.</p>
                      </div>
                    ) : comments.map(comment => {
                      const isMe = comment.user_id === user?.id || comment.user_name === userName;
                      const initials = (comment.user_name ?? '?').split(' ').map((n:string) => n[0]).slice(0,2).join('').toUpperCase();
                      return (
                        <div key={comment.id} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'} group/chat relative`}>
                          {/* Avatar */}
                          <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-zinc-300 shrink-0 mt-auto">
                            {comment.user_avatar ? (
                              <img src={comment.user_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                            ) : initials}
                          </div>
                          <div className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-baseline gap-2">
                              {!isMe && <span className="text-xs font-medium text-zinc-400">{comment.user_name}</span>}
                              <span className="text-[10px] text-zinc-600">
                                {new Date(comment.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`flex items-center gap-2 relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 rounded-tr-none' : 'bg-zinc-800/60 text-zinc-200 border border-zinc-700/50 rounded-tl-none'}`}>
                                {comment.message}
                              </div>
                              {isMe && (
                                <button onClick={() => deleteComment(comment.id)} className="opacity-0 group-hover/chat:opacity-100 text-zinc-500 hover:text-red-400 p-1 transition-opacity shrink-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={commentsEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Input */}
                <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/50">
                  {/* Sender identity badge */}
                  <div className="flex items-center gap-2 mb-3 text-xs text-zinc-500">
                    <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-200">
                      {userInitials}
                    </div>
                    <span>Mengirim sebagai <strong className="text-zinc-300">{userName}</strong></span>
                  </div>
                  <form onSubmit={addComment} className="flex gap-2">
                    <Input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tulis pesan diskusi..."
                      className="bg-zinc-900 border-zinc-800 text-sm flex-1 h-10 px-4" />
                    <Button type="submit" size="icon" className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 h-10 w-10">
                      <Send className="h-4 w-4 ml-0.5" />
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </div>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
