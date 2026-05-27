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
    <div className="flex h-screen bg-transparent font-sans antialiased text-gray-100 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        <header className="md:hidden flex items-center p-4 bg-black/40 backdrop-blur-md border-b border-white/10 z-10 shadow-sm sticky top-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 mr-2 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight text-white">Tarik Bhai AI</span>
            <span className="text-xs font-semibold text-cyan-400">Quantum Intelligence Online</span>
          </div>
        </header>

        <div className="flex-1 p-0 md:p-6 overflow-hidden relative">
          <div className="h-full overflow-y-auto relative z-0">
             {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
