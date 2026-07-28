import { ProjectBoard } from '@/components/ProjectBoard';
import { BriefcaseBusiness } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 px-4 py-8 md:p-10 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col gap-2 pb-6 border-b border-zinc-800/60">
          <div className="flex items-center space-x-3 mb-1">
            <div className="p-2 bg-zinc-800/40 rounded-lg border border-zinc-700/50 text-zinc-300">
              <BriefcaseBusiness className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
              Logaritma Project Hub
            </h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base max-w-3xl leading-relaxed">
            Sistem pemantauan terpusat untuk alur kerja pengembangan web. Kelola status, deadline, dan pastikan setiap project terpantau dengan profesional.
          </p>
        </header>
        
        <ProjectBoard />
      </div>
    </main>
  );
}
