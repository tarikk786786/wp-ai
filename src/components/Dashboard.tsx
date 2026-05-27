import { Code, Layout, Search, MessageSquare, BookOpen, Calculator, Briefcase, Megaphone, PenTool, Bug, Layers, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

const AI_TASKS = [
  { icon: <Code />, title: 'Coding Helper', desc: 'Write, debug, and optimize code in any language', color: 'from-blue-400 to-blue-600' },
  { icon: <Layout />, title: 'Website Builder', desc: 'Generate UI/UX components and landing pages', color: 'from-emerald-400 to-emerald-600' },
  { icon: <Search />, title: 'SEO Assistant', desc: 'Optimize content for search engine rankings', color: 'from-violet-400 to-violet-600' },
  { icon: <MessageSquare />, title: 'WhatsApp Reply Writer', desc: 'Draft perfect replies for business or friends', color: 'from-green-400 to-green-600' },
  { icon: <BookOpen />, title: 'Research Assistant', desc: 'Deep dive into any topic with factual analysis', color: 'from-cyan-400 to-cyan-600' },
  { icon: <Calculator />, title: 'Math & Physics Solver', desc: 'Step-by-step solutions for complex problems', color: 'from-rose-400 to-rose-600' },
  { icon: <Briefcase />, title: 'Business Planner', desc: 'Create strategies, pitches, and financial models', color: 'from-amber-400 to-amber-600' },
  { icon: <Megaphone />, title: 'Ad Copy Generator', desc: 'Write high-converting ads for social media', color: 'from-orange-400 to-orange-600' },
  { icon: <PenTool />, title: 'Content Writer', desc: 'Blogs, articles, essays, and creative writing', color: 'from-fuchsia-400 to-fuchsia-600' },
  { icon: <Bug />, title: 'Bug Fixer', desc: 'Paste errors and get instant fixes', color: 'from-red-400 to-red-600' },
  { icon: <Layers />, title: 'UI/UX Improver', desc: 'Get design critiques and improvement ideas', color: 'from-indigo-400 to-indigo-600' },
  { icon: <GraduationCap />, title: 'Study Assistant', desc: 'Learn topics faster with simple explanations', color: 'from-teal-400 to-teal-600' },
];

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto p-4 md:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Multi-Task Intelligence
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-2xl">
          Tarik Bhai AI is trained across multiple disciplines. Select a module below or jump straight into the chat to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pt-4">
        {AI_TASKS.map((task, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i}
            className="glass-panel glass-panel-hover p-6 rounded-2xl cursor-pointer group relative overflow-hidden"
            onClick={() => {
              // Pre-fill chat logic could go here, or just route to Inbox
              const el = document.querySelector('button[aria-label="AI Chat"]');
              if (el) (el as HTMLElement).click();
            }}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${task.color} opacity-10 blur-3xl rounded-full group-hover:opacity-20 transition-opacity`}></div>
            <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform bg-gradient-to-br ${task.color} shadow-lg`}>
              {task.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{task.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
              {task.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
