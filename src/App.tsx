import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Inbox from './components/Inbox';
import Dashboard from './components/Dashboard';
import Rules from './components/Rules';
import Settings from './components/Settings';
import { Menu } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('inbox');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'inbox': return <Inbox />;
      case 'dashboard': return <Dashboard />;
      case 'rules': return <Rules />;
      case 'settings': return <Settings />;
      default: return <Inbox />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans antialiased text-slate-800 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="md:hidden flex items-center p-4 bg-white border-b border-slate-200 z-10 shadow-sm sticky top-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg active:bg-slate-200 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight text-slate-800">Friend Agent</span>
          <span className="text-xs font-semibold text-emerald-600">Online & Protected</span>
          </div>
        </header>

        <div className="flex-1 p-0 md:p-6 overflow-hidden bg-slate-50 relative">
          <div className="h-full bg-slate-50 md:bg-transparent overflow-y-auto md:overflow-hidden relative z-0">
             {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
