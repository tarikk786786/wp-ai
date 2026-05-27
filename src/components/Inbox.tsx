import { useState, useEffect, useRef } from 'react';
import { Chat } from '../types';
import { Send, Sparkles, Smile, RefreshCw, Pen, UserCircle, CheckCircle2, AlertTriangle, ArrowLeft, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

export default function Inbox() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatPhone, setActiveChatPhone] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [editingSuggestion, setEditingSuggestion] = useState(false);
  const [customSuggestText, setCustomSuggestText] = useState('');
  
  const [isMobileList, setIsMobileList] = useState(true);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll chats from server every 2.5 seconds
  useEffect(() => {
    const fetchChats = () => {
      fetch(getApiUrl('/api/chats'))
        .then(res => res.json())
        .then(data => {
          setChats(data);
          if (loading) {
            setLoading(false);
            if (data.length > 0) {
              setActiveChatPhone(data[0].phone);
            }
          }
        })
        .catch(err => console.error("Error fetching chats:", err));
    };

    fetchChats();
    const interval = setInterval(fetchChats, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  // Find active chat object
  const activeChat = chats.find(c => c.phone === activeChatPhone) || null;

  // Sync suggestion text when chat changes
  useEffect(() => {
    if (activeChat) {
      setCustomSuggestText(activeChat.suggestedReply || '');
      setEditingSuggestion(false);
    }
  }, [activeChatPhone, activeChat?.suggestedReply]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages?.length]);

  const handleSelectChat = (phone: string) => {
    setActiveChatPhone(phone);
    setIsMobileList(false);
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'angry': return 'text-red-500 bg-red-50 border border-red-200';
      case 'happy': return 'text-emerald-500 bg-emerald-50 border border-emerald-100';
      case 'confused': return 'text-amber-500 bg-amber-50 border border-amber-200';
      case 'urgent': return 'text-rose-500 bg-rose-50 border border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border border-slate-200';
    }
  };

  // 1. Approve AI suggestion and send
  const handleApproveSend = async () => {
    if (!activeChat) return;
    try {
      const res = await fetch(getApiUrl('/api/reply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activeChat.phone, text: customSuggestText })
      });
      if (res.ok) {
        const updateRes = await fetch(getApiUrl('/api/chats'));
        const data = await updateRes.json();
        setChats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Send manual message
  const handleSendManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !inputText.trim()) return;

    const currentText = inputText;
    setInputText('');

    try {
      const res = await fetch(getApiUrl('/api/reply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activeChat.phone, text: currentText })
      });
      if (res.ok) {
        const updateRes = await fetch(getApiUrl('/api/chats'));
        const data = await updateRes.json();
        setChats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Mark Resolved
  const handleMarkResolved = async () => {
    if (!activeChat) return;
    try {
      const res = await fetch(getApiUrl('/api/resolve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activeChat.phone })
      });
      if (res.ok) {
        const updateRes = await fetch(getApiUrl('/api/chats'));
        const data = await updateRes.json();
        setChats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Regenerate suggestion with option override context
  const handleRegenerate = async (instruction?: string) => {
    if (!activeChat) return;
    setRegenerating(true);
    try {
      const res = await fetch(getApiUrl('/api/suggest/regenerate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: activeChat.phone, 
          overrideContext: instruction 
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCustomSuggestText(data.suggestedReply);
        const updateRes = await fetch(getApiUrl('/api/chats'));
        const updatedData = await updateRes.json();
        setChats(updatedData);
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
        <RefreshCw className="animate-spin text-emerald-500 mb-3" size={32} />
        <span className="font-semibold text-sm">Loading conversations brother...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col md:flex-row bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
      
      {/* Chat List */}
      <div className={`w-full md:w-1/3 border-r border-slate-100 flex flex-col ${!isMobileList ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Messages</h2>
          <div className="flex gap-2 mt-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">Friend Mode Active</span>
            {chats.some(c => c.status === 'needs_approval') && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                Needs Approval ({chats.filter(c => c.status === 'needs_approval').length})
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => handleSelectChat(chat.phone)}
              className={`p-4 border-b border-slate-50 cursor-pointer transition-colors ${activeChatPhone === chat.phone ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-slate-800 leading-tight">{chat.name}</h3>
                <span className="text-xs text-slate-400 font-medium">{chat.timestamp}</span>
              </div>
              <p className="text-sm text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-1.5 flex-wrap">
                  {chat.status === 'needs_approval' && (
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                      <AlertTriangle size={10} /> Approval
                    </span>
                  )}
                  {chat.mood && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getMoodColor(chat.mood)}`}>
                      {chat.mood}
                    </span>
                  )}
                </div>
                {chat.unread > 0 && (
                  <span className="bg-emerald-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
          {chats.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              No active conversations yet brother. Link WhatsApp in Settings to start!
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#F0F2F5] ${isMobileList ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="bg-white p-3 md:p-4 border-b border-slate-200 flex items-center gap-3 shadow-sm z-10 sticky top-0">
              <button 
                className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full mr-1 -ml-2"
                onClick={() => setIsMobileList(true)}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 flex-shrink-0">
                <UserCircle size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-800 truncate leading-snug">{activeChat.name}</h2>
                <p className="text-xs text-slate-500 font-medium truncate">{activeChat.phone}</p>
              </div>
              {activeChat.status !== 'resolved' && (
                <button 
                  onClick={handleMarkResolved}
                  className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold transition-colors"
                >
                  <CheckCircle2 size={15} /> Mark Resolved
                </button>
              )}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              <div className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-semibold my-4">Conversation Started</div>
              
              {activeChat.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}
                >
                  <div 
                    className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/50' 
                        : 'bg-[#D9FDD3] text-slate-900 rounded-tr-sm'
                    }`}
                  >
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                    <div className={`text-[10px] mt-1.5 flex justify-end font-semibold ${msg.sender === 'user' ? 'text-slate-400' : 'text-emerald-700/80'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                  {msg.sender !== 'user' && (
                    <span className="text-[10px] text-slate-400 mt-1 mr-1.5 flex items-center gap-1 font-semibold">
                      <Sparkles size={10} className="text-emerald-500" /> 
                      {msg.sender === 'bot' ? 'Auto-reply (Tarik AI)' : 'Human Override'}
                    </span>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestion Box */}
            <div className="p-3 md:p-4 bg-white border-t border-slate-200">
              {activeChat.suggestedReply || customSuggestText ? (
                <div className="mb-3 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-100/70 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={16} className="text-emerald-600 animate-pulse" />
                      <span className="text-sm font-bold text-emerald-800">Suggested Hinglish Reply</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Memory Active</span>
                  </div>

                  {editingSuggestion ? (
                    <textarea
                      value={customSuggestText}
                      onChange={(e) => setCustomSuggestText(e.target.value)}
                      className="w-full border border-emerald-200 rounded-xl p-3 text-sm text-slate-700 outline-none bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none font-medium"
                      rows={3}
                    />
                  ) : (
                    <div className="bg-white/80 rounded-xl p-3 text-slate-800 text-sm mb-3.5 font-medium border border-emerald-100/30 shadow-inner min-h-[50px] whitespace-pre-wrap leading-relaxed">
                      {customSuggestText}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3.5">
                    <button 
                      onClick={() => handleRegenerate()}
                      disabled={regenerating}
                      className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={regenerating ? "animate-spin" : ""} size={12} /> Regenerate
                    </button>
                    <button 
                      onClick={() => handleRegenerate("Make it much warmer, emotionally connective style")}
                      disabled={regenerating}
                      className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                    >
                      <Smile size={12} className="text-emerald-500" /> More Emotional
                    </button>
                    <button 
                      onClick={() => handleRegenerate("Keep it very short, direct and casual")}
                      disabled={regenerating}
                      className="text-xs bg-white text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 font-semibold transition-colors disabled:opacity-50"
                    >
                      Make Short
                    </button>
                    <button 
                      onClick={() => setEditingSuggestion(!editingSuggestion)}
                      className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors flex items-center gap-1 ${
                        editingSuggestion 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Pen size={12} /> {editingSuggestion ? "Finish Editing" : "Edit Response"}
                    </button>
                  </div>

                  <div className="flex gap-2.5">
                    <button 
                      onClick={handleApproveSend}
                      disabled={regenerating}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:shadow shadow-emerald-500/10"
                    >
                      <Send size={15} /> Approve & Send
                    </button>
                    <button 
                      onClick={() => setCustomSuggestText('')}
                      className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-bold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-2 p-3 bg-slate-50 text-slate-400 text-xs text-center border border-dashed border-slate-200 rounded-xl font-medium flex justify-center items-center gap-1.5">
                  <Bot size={14} /> Send a manual reply below, or click 'Regenerate' to trigger an AI response suggestion!
                  <button 
                    onClick={() => handleRegenerate()}
                    className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded ml-2 font-bold"
                  >
                    Suggest AI
                  </button>
                </div>
              )}

              {/* Manual Input Form */}
              <form onSubmit={handleSendManual} className="flex gap-2">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Write a message..." 
                  className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-4 rounded-xl transition-colors flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-[#F0F2F5]">
            <Bot size={48} className="mb-4 text-slate-300 animate-bounce" />
            <h3 className="text-lg font-medium text-slate-500 mb-2">WhatsApp Auto-Reply Active</h3>
            <p className="text-sm max-w-sm">No active conversations found brother. Link WhatsApp in Settings to attach your WhatsApp account and start listening to messages!</p>
          </div>
        )}
      </div>
    </div>
  );
}
