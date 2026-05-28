import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Search, RefreshCw } from 'lucide-react';

interface Chat {
  phone: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  messages: any[];
  mood: string;
}

export default function AdminChats({ token }: { token: string }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Chat | null>(null);

  useEffect(() => { fetchChats(); }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/chats', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setChats(data.chats || []); }
    } catch {} finally { setLoading(false); }
  };

  const deleteChat = async (phone: string) => {
    if (!confirm(`Delete all messages for ${phone}?`)) return;
    try {
      await fetch(`/api/chats/${phone}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setChats(prev => prev.filter(c => c.phone !== phone));
      if (selected?.phone === phone) setSelected(null);
    } catch {}
  };

  const filtered = chats.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.lastMessage?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
        <button onClick={fetchChats} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-500 text-sm">{search ? 'No chats match your search' : 'No chats yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((chat) => (
            <div key={chat.phone} className="bg-white/5 border border-white/8 rounded-2xl p-4 hover:bg-white/8 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm truncate">{chat.name || chat.phone}</h3>
                    {chat.mood && chat.mood !== 'neutral' && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        chat.mood === 'happy' ? 'bg-emerald-500/20 text-emerald-400' :
                        chat.mood === 'angry' ? 'bg-red-500/20 text-red-400' :
                        chat.mood === 'urgent' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>{chat.mood}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.phone}</p>
                  <p className="text-sm text-gray-400 mt-2 truncate">{chat.lastMessage}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-gray-600">{chat.timestamp}</span>
                    <span className="text-[10px] text-gray-600">{chat.messages?.length || 0} messages</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteChat(chat.phone)}
                  className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all ml-2"
                  title="Delete chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
