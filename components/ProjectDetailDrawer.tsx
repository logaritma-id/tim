'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Project, ProjectTask, ActivityLog } from '@/lib/types';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, ListTodo, Activity, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  project: Project;
  children: React.ReactNode;
}

export function ProjectDetailDrawer({ project, children }: Props) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [newTaskName, setNewTaskName] = useState('');
  const [newLogNotes, setNewLogNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: tData } = await supabase.from('project_tasks').select('*').eq('project_id', project.id);
    if (tData) setTasks(tData);
    
    const { data: lData } = await supabase.from('activity_logs').select('*').eq('project_id', project.id).order('created_at', { ascending: false });
    if (lData) setLogs(lData);
    
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchData();
  }, [open]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    
    const { data, error } = await supabase.from('project_tasks').insert([{
      project_id: project.id,
      task_name: newTaskName,
      status: 'todo'
    }]).select();
    
    if (error) {
      toast.error('Gagal menambahkan task');
    } else if (data) {
      setTasks([...tasks, data[0]]);
      setNewTaskName('');
      toast.success('Task ditambahkan');
    }
  };

  const toggleTask = async (task: ProjectTask) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    
    // Optimistic update
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    const { error } = await supabase.from('project_tasks').update({ status: newStatus }).eq('id', task.id);
    if (error) {
      toast.error('Gagal mengupdate task');
      fetchData(); // Revert
    }
  };

  const addLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNotes.trim()) return;
    
    const { data, error } = await supabase.from('activity_logs').insert([{
      project_id: project.id,
      notes: newLogNotes,
      updated_by: 'Tim Dev' // In a real app, use auth user
    }]).select();
    
    if (error) {
      toast.error('Gagal menambahkan log');
    } else if (data) {
      setLogs([data[0], ...logs]);
      setNewLogNotes('');
      toast.success('Log aktivitas ditambahkan');
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<div className="cursor-pointer">{children}</div>} />
      <SheetContent className="w-full sm:max-w-md bg-[#09090b] border-zinc-800 text-zinc-100 p-0 flex flex-col h-full">
        <SheetHeader className="p-6 pb-4 border-b border-zinc-800/60">
          <SheetTitle className="text-xl text-zinc-50">{project.project_title}</SheetTitle>
          <SheetDescription className="text-zinc-400">
            Detail progress dan aktivitas untuk klien {project.client_name}.
          </SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="tasks" className="flex-1 flex flex-col">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900/80">
              <TabsTrigger value="tasks" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50"><ListTodo className="w-4 h-4 mr-2" /> Tasks</TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-50"><Activity className="w-4 h-4 mr-2" /> Activity Log</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 mt-4">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-500 w-6 h-6" /></div>
            ) : (
              <>
                {/* TASKS CONTENT */}
                <TabsContent value="tasks" className="p-6 pt-0 m-0 space-y-4">
                  <form onSubmit={addTask} className="flex gap-2">
                    <Input 
                      value={newTaskName} 
                      onChange={(e) => setNewTaskName(e.target.value)} 
                      placeholder="Tambah task baru..." 
                      className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 text-sm"
                    />
                    <Button type="submit" size="icon" className="bg-zinc-100 hover:bg-white text-zinc-900 shrink-0"><Plus className="h-4 w-4" /></Button>
                  </form>
                  <div className="space-y-3 mt-6">
                    {tasks.length === 0 ? (
                      <p className="text-center text-zinc-500 text-sm py-4">Belum ada task.</p>
                    ) : tasks.map(task => (
                      <div key={task.id} className="flex items-start space-x-3 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors">
                        <Checkbox 
                          checked={task.status === 'done'} 
                          onCheckedChange={() => toggleTask(task)} 
                          className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <div className="space-y-1 leading-none">
                          <label className={`text-sm font-medium leading-none ${task.status === 'done' ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                            {task.task_name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* LOGS CONTENT */}
                <TabsContent value="logs" className="p-6 pt-0 m-0 space-y-6">
                  <form onSubmit={addLog} className="space-y-3">
                    <Textarea 
                      value={newLogNotes} 
                      onChange={(e) => setNewLogNotes(e.target.value)} 
                      placeholder="Tulis update progres hari ini..." 
                      className="bg-zinc-900 border-zinc-800 focus-visible:ring-zinc-700 min-h-[80px] text-sm resize-none"
                    />
                    <Button type="submit" size="sm" className="w-full bg-zinc-100 hover:bg-white text-zinc-900">Posting Update</Button>
                  </form>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                    {logs.length === 0 ? (
                      <p className="text-center text-zinc-500 text-sm py-4">Belum ada log aktivitas.</p>
                    ) : logs.map(log => (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-zinc-200 text-sm">{log.updated_by}</h4>
                            <time className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 bg-zinc-800/50 rounded-full">
                              {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </time>
                          </div>
                          <p className="text-zinc-400 text-sm">{log.notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
