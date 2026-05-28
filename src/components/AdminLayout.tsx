import { useState, useEffect } from 'react';
import { LayoutDashboard, MessageSquare, Users, Settings as SettingsIcon, Shield, LogOut, Zap, Menu, X, Bell, ToggleLeft, ToggleRight } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminChats from './AdminChats';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';

interface AdminLayoutProps {
  token: string;
  onLogout: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chats', label: 'Chats', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminLayout({ token, onLogout }: AdminLayoutProps) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.maintenance !== undefined) setMaintenance(d.maintenance); })
      .catch(() => {});
  }, [token]);

  const toggleMaintenance = async () => {
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !maintenance })
      });
      if (res.ok) setMaintenance(!maintenance);
    } catch {}
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <AdminDashboard token={token} />;
      case 'chats': return <AdminChats token={token} />;
      case 'users': return <AdminUsers token={token} />;
      case 'settings': return <AdminSettings token={token} />;
      default: return <AdminDashboard token={token} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    onLogout();
  };

  return (
    <div className="h-screen flex bg-[#0a0a0f] text-gray-100 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-40 h-full w-64 bg-[#0d0d14] border-r border-white/8 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <h2 className="font-bold text-sm text-white">Tarik Bhai AI</h2>
                <span className="text-[10px] text-cyan-400 font-semibold">ADMIN PANEL</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === item.id
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/8 space-y-2">
          {/* Maintenance Toggle */}
          <button
            onClick={toggleMaintenance}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              maintenance ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {maintenance ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {maintenance ? 'Maintenance ON' : 'Maintenance OFF'}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-white/8 bg-black/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-1 text-gray-400 hover:text-white rounded-lg">
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-lg capitalize">{currentView}</h1>
          </div>
          <div className="flex items-center gap-3">
            {maintenance && (
              <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30 font-semibold">
                🔧 Maintenance Mode
              </span>
            )}
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-cyan-400" />
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderView()}
        </div>
      </main>
    </div>
  );
}
