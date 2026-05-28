import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sun, Moon, Trash2, MessageSquare, Sparkles, AlertCircle, ThumbsUp, ArrowDown, Zap, Shield } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const WELCOME_MSG = `Hi! Main Tarik Bhai AI hoon — aapka advanced digital assistant. Coding, research, writing, problem-solving, planning, creativity aur har digital kaam mein lightning speed se madad karta hoon. Kuch bhi poochho! ⚡`;

const QUICK_PROMPTS = [
  { icon: '💻', label: 'Write code for me' },
  { icon: '📝', label: 'Help me write content' },
  { icon: '🧠', label: 'Explain a topic simply' },
  { icon: '💡', label: 'Give me a business idea' },
  { icon: '🎨', label: 'Design suggestions' },
  { icon: '🔍', label: 'Research something' },
];

export default function UserChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('tarik-ai-chat');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [showScroll, setShowScroll] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Rate limiting
  const [msgCount, setMsgCount] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);

  const getApiUrl = (path: string) => {
    const backendUrl = (import.meta as any).env.VITE_BACKEND_URL;
    if (backendUrl) return `${backendUrl.replace(/\/$/, '')}${path}`;
    
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://127.0.0.1:3001${path}`;
    }
    return path;
  };

  useEffect(() => {
    localStorage.setItem('tarik-ai-chat', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch(getApiUrl('/api/announcement')).then(r => r.json()).then(d => {
      if (d.text) setAnnouncement(d.text);
    }).catch(() => {});
  }, []);

  // Reset rate limit every minute
  useEffect(() => {
    const interval = setInterval(() => { setMsgCount(0); setRateLimited(false); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScroll(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || isLoading) return;

    // Rate limit: 15 messages per minute
    if (msgCount >= 15) {
      setRateLimited(true);
      setError('Too many messages. Please wait a moment.');
      return;
    }
    setMsgCount(prev => prev + 1);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { role: 'user', text: msgText, timestamp: now };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.slice(-20) })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error. Try again.');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([...newMessages, { role: 'model', text: data.reply, timestamp: aiTime }]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    if (confirm('Clear entire chat?')) {
      setMessages([]);
      localStorage.removeItem('tarik-ai-chat');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const bg = darkMode ? 'bg-[#0a0a0f]' : 'bg-gray-50';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-white/10 border-white/15 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400';

  return (
    <div className={`h-screen flex flex-col ${bg} ${textColor} transition-colors duration-300`}>
      {/* Header */}
      <header className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-white'} backdrop-blur-xl z-10`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-cyan-500 to-violet-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} shadow-lg`}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Tarik Bhai AI</h1>
            <p className={`text-xs ${darkMode ? 'text-cyan-400' : 'text-blue-500'} font-medium`}>
              {isLoading ? '● Thinking...' : '● Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/admin')} title="Admin Access" className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-cyan-500' : 'hover:bg-gray-100 text-blue-600'}`}>
            <Shield size={18} />
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {messages.length > 0 && (
            <button onClick={clearChat} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Announcement Banner */}
      {announcement && (
        <div className={`px-4 py-2 text-sm text-center ${darkMode ? 'bg-cyan-500/10 text-cyan-300 border-b border-cyan-500/20' : 'bg-blue-50 text-blue-700 border-b border-blue-200'}`}>
          📢 {announcement}
        </div>
      )}

      {/* Messages Area */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center px-4">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${darkMode ? 'bg-gradient-to-br from-cyan-500 to-violet-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'} shadow-2xl`}>
              <Sparkles size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Tarik Bhai AI</h2>
            <p className={`text-sm mb-8 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{WELCOME_MSG}</p>
            <div className="grid grid-cols-2 gap-3 w-full">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.label)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-left transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30' : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300'} active:scale-95`}
                >
                  <span className="text-lg">{p.icon}</span>
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? darkMode ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                    : darkMode ? 'bg-white/8 border border-white/10 text-gray-100' : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/50' : darkMode ? 'text-gray-500' : 'text-gray-400'} text-right`}>{msg.timestamp}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`rounded-2xl px-5 py-3 ${darkMode ? 'bg-white/8 border border-white/10' : 'bg-white border border-gray-200'}`}>
                  <div className="flex gap-1.5 items-center">
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-cyan-400' : 'bg-blue-500'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-cyan-400' : 'bg-blue-500'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-cyan-400' : 'bg-blue-500'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScroll && (
        <button onClick={scrollToBottom} className={`absolute bottom-24 right-6 p-2 rounded-full shadow-lg z-10 ${darkMode ? 'bg-cyan-600 text-white' : 'bg-blue-500 text-white'}`}>
          <ArrowDown size={18} />
        </button>
      )}

      {/* Error */}
      {error && (
        <div className={`mx-4 mb-2 px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${darkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')} className="ml-auto font-bold">×</button>
        </div>
      )}

      {/* Input Area */}
      <div className={`px-4 py-3 border-t ${darkMode ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-white'} backdrop-blur-xl`}>
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={rateLimited ? 'Please wait...' : 'Type your message...'}
            disabled={rateLimited}
            rows={1}
            className={`flex-1 px-4 py-3 rounded-xl border resize-none text-sm focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-cyan-500/50' : 'focus:ring-blue-500/50'} ${inputBg} transition-all`}
            style={{ maxHeight: '120px' }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || rateLimited}
            className={`p-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className={`text-center text-[11px] mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          Tarik Bhai AI • Powered by Advanced Intelligence
        </p>
      </div>
    </div>
  );
}
