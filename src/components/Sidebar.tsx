import { MessageSquare, LayoutDashboard, Settings, Bot, X, Sparkles, Phone } from 'lucide-react';

type SidebarProps = {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export default function Sidebar({ currentView, setCurrentView, isOpen, setIsOpen }: SidebarProps) {
  const items = [
    { id: 'inbox', label: 'AI Chat', icon: <MessageSquare size={20} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'rules', label: 'WhatsApp Bot', icon: <Phone size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-400 to-violet-500 p-2 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              <Bot size={24} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Tarik Bhai AI</span>
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1"><Sparkles size={10} /> Online</span>
            </div>
          </div>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                currentView === item.id 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-white shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <div className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110 text-cyan-400' : 'group-hover:text-cyan-400'}`}>
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">TB</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-white">Tarik Bhai</p>
              <p className="text-[10px] text-cyan-400 uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
