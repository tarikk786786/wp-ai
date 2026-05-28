import { useState, useEffect } from 'react';
import { MessageSquare, Users, Zap, TrendingUp, Clock, Bot, Activity, Shield } from 'lucide-react';
import AdminRules from './Rules';

interface AdminDashboardProps {
  token: string;
}

interface Stats {
  totalChats: number;
  autoRepliesSent: number;
  totalUsers: number;
  activeToday: number;
  whatsappStatus: string;
  uptime: number;
  aiModel: string;
  maintenance: boolean;
}

export default function AdminDashboard({ token }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalChats: 0, autoRepliesSent: 0, totalUsers: 0, activeToday: 0,
    whatsappStatus: 'offline', uptime: 0, aiModel: 'gemini-2.5-flash', maintenance: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const cards = [
    { label: 'Total Chats', value: stats.totalChats, icon: MessageSquare, color: 'from-cyan-500 to-blue-600', shadowColor: 'shadow-cyan-500/10' },
    { label: 'Auto Replies', value: stats.autoRepliesSent, icon: Bot, color: 'from-violet-500 to-purple-600', shadowColor: 'shadow-violet-500/10' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-emerald-500 to-green-600', shadowColor: 'shadow-emerald-500/10' },
    { label: 'Active Today', value: stats.activeToday, icon: TrendingUp, color: 'from-amber-500 to-orange-600', shadowColor: 'shadow-amber-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Embedded WhatsApp Bot Manager */}
      <div className="bg-white/5 border border-white/8 rounded-2xl p-2 mb-8">
        <AdminRules />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`bg-white/5 border border-white/8 rounded-2xl p-5 backdrop-blur-sm ${card.shadowColor} shadow-lg hover:bg-white/8 transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{card.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Status */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <Activity size={16} /> System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">WhatsApp</span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                stats.whatsappStatus === 'online'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {stats.whatsappStatus === 'online' ? '● Connected' : '● Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">AI Model</span>
              <span className="text-xs bg-cyan-500/15 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 font-mono">{stats.aiModel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Uptime</span>
              <span className="text-sm text-white font-medium flex items-center gap-1">
                <Clock size={14} className="text-gray-500" />
                {formatUptime(stats.uptime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Maintenance</span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                stats.maintenance
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {stats.maintenance ? '🔧 Active' : '✓ Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <Zap size={16} /> Quick Info
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">API Engine</span>
              <span className="text-sm text-white">OpenRouter + Gemini</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Fallback</span>
              <span className="text-sm text-white">Local Brain (Offline)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Security</span>
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Shield size={12} /> Protected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Rate Limit</span>
              <span className="text-sm text-white">15 msg/min per user</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
