import { ProjectBoard } from '@/components/ProjectBoard';
import { Layers } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 lg:p-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-3 pb-8 pt-4">
          <div className="inline-flex items-center space-x-3 mb-2">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Layers className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              Project Hub
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Centralized monitoring platform untuk alur kerja web development Logaritma. Pantau status, kelola deadline, dan sinkronisasi update otomatis ke klien.
          </p>
        </header>
        
        <ProjectBoard />
      </div>
    </main>
  );
}
