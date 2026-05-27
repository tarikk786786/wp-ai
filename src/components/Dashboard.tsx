import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Flame, AlertCircle, Bot, Activity, CheckCircle, RefreshCw } from 'lucide-react';
import { DashboardStats } from '../types';

// Helper to determine active backend API base dynamically (supports Netlify production host mappings)
const getApiUrl = (path: string) => {
  const savedUrl = localStorage.getItem('WP_BOT_BACKEND_URL');
  if (savedUrl) {
    const base = savedUrl.endsWith('/') ? savedUrl.slice(0, -1) : savedUrl;
    return `${base}${path}`;
  }
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? path : `http://localhost:3001${path}`;
};

const chartData = [
  { name: 'Mon', replies: 400 },
  { name: 'Tue', replies: 600 },
  { name: 'Wed', replies: 850 },
  { name: 'Thu', replies: 930 },
  { name: 'Fri', replies: 1200 },
  { name: 'Sat', replies: 1100 },
  { name: 'Sun', replies: 800 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalChats: 0,
    autoRepliesSent: 0,
    pendingApprovals: 0,
    hotLeads: 0,
    angryCustomers: 0,
    missedChats: 0,
    aiConfidenceScore: 95.0,
    whatsappApiStatus: 'offline'
  });
  const [loading, setLoading] = useState(true);

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = () => {
      fetch(getApiUrl('/api/stats'))
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => console.error("Error fetching stats:", err));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: 'online' | 'offline' | 'degraded') => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'degraded': return 'bg-amber-500 animate-pulse';
      case 'offline': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusText = (status: 'online' | 'offline' | 'degraded') => {
    switch (status) {
      case 'online': return 'CONNECTED';
      case 'degraded': return 'CONNECTING';
      case 'offline': return 'OFFLINE';
      default: return 'UNKNOWN';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
        <RefreshCw className="animate-spin text-emerald-500 mb-3" size={32} />
        <span className="font-semibold text-sm">Syncing dashboard statistics brother...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 overflow-y-auto p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
          <p className="text-slate-500">Monitor your AI assistant's performance</p>
        </div>
        <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(stats.whatsappApiStatus)}`}></div>
          <span className="text-sm font-semibold text-slate-700">
            WhatsApp Status: {getStatusText(stats.whatsappApiStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Auto Replies Sent', value: stats.autoRepliesSent, icon: <Bot size={24} className="text-emerald-500" />, color: 'bg-emerald-50' },
          { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <AlertCircle size={24} className="text-amber-500" />, color: 'bg-amber-50' },
          { label: 'Hot Leads', value: stats.hotLeads, icon: <Flame size={24} className="text-orange-500" />, color: 'bg-orange-50' },
          { label: 'Avg Confidence', value: `${stats.aiConfidenceScore}%`, icon: <Activity size={24} className="text-blue-500" />, color: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-4 rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-0.5">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-96">
          <h3 className="font-semibold text-slate-800 mb-6">Auto-Replies Over Time (7 Days)</h3>
          <div className="flex-1 w-full relative min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="replies" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReplies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-6">Recent Activity</h3>
          <div className="space-y-5">
            {[
              { text: `Total chats recorded: ${stats.totalChats} in history`, time: 'Live sync active', type: 'info' },
              { text: `Auto-replied successfully to ${stats.autoRepliesSent} queries`, time: 'Real-time automation', type: 'success' },
              { text: `Pending approvals: ${stats.pendingApprovals} require takeover`, time: 'Awaiting human review', type: 'alert' },
              { text: 'Tarik AI brain is active', time: 'Active Roman Urdu model', type: 'info' },
              { text: `System health is green. Device status matches: ${stats.whatsappApiStatus.toUpperCase()}`, time: 'Telemetry', type: 'success' },
            ].map((activity, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-0.5">
                  {activity.type === 'success' && <CheckCircle size={16} className="text-emerald-500" />}
                  {activity.type === 'alert' && <AlertCircle size={16} className="text-red-500" />}
                  {activity.type === 'info' && <MessageSquare size={16} className="text-blue-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{activity.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
