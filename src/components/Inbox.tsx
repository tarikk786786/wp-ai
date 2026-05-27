import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Copy, Trash2, RefreshCw, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Message = {
  role: 'user' | 'model';
  text: string;
};

const SUGGESTIONS = [
  "Write code for me",
  "Fix my website error",
  "Create ad copy",
  "Explain this topic",
  "Make a business plan",
  "Generate image prompt",
  "Summarize text",
  "Translate message",
  "Write WhatsApp reply",
  "Create SEO strategy"
];

export default function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('tarik_ai_chat');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('tarik_ai_chat', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg: Message = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!res.ok) {
        throw new Error('Failed to connect to AI server. Please try again.');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: 'model', text: data.reply }]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      // Remove user message if failed, or let user retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length === 0) return;
    const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserMsgIndex === -1) return;

    const actualIndex = messages.length - 1 - lastUserMsgIndex;
    const previousMessages = messages.slice(0, actualIndex + 1);
    
    setMessages(previousMessages);
    handleSend(messages[actualIndex].text);
  };

  const clearChat = () => {
    if (confirm('Clear entire chat history?')) {
      setMessages([]);
      localStorage.removeItem('tarik_ai_chat');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex flex-col bg-transparent relative rounded-xl border border-white/5 shadow-2xl overflow-hidden glass-panel">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30">
            <Sparkles className="text-cyan-400" size={20} />
          </div>
          <h2 className="font-semibold text-lg text-white">Quantum Chat</h2>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 p-1 shadow-[0_0_50px_rgba(34,211,238,0.3)]">
              <div className="w-full h-full bg-black/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot size={40} className="text-cyan-400" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                Hi, I'm Tarik Bhai AI
              </h1>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                Main space-time se aage sochta hoon. Coding, research, writing, problem-solving, 
                aur har digital kaam mein lightning speed se madad karta hoon. Boliye, aaj kya banayein?
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
              {SUGGESTIONS.map((sug, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(sug)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 text-sm text-gray-300 hover:text-white transition-all text-left truncate"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500' : 'bg-gradient-to-br from-cyan-400 to-blue-500'}`}>
                  {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                </div>
                <div className={`max-w-[80%] md:max-w-[70%] group ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-violet-600 text-white rounded-tr-sm' 
                      : 'bg-white/10 text-gray-100 rounded-tl-sm border border-white/5'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.text}</p>
                  </div>
                  {msg.role === 'model' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyToClipboard(msg.text)} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 p-1">
                        <Copy size={12} /> Copy
                      </button>
                      {i === messages.length - 1 && (
                        <button onClick={handleRegenerate} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 p-1">
                          <RefreshCw size={12} /> Regenerate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white/10 rounded-tl-sm border border-white/5 flex items-center gap-2">
                  <Loader2 className="animate-spin text-cyan-400" size={16} />
                  <span className="text-sm text-cyan-400 animate-pulse">Computing through quantum space...</span>
                </div>
              </motion.div>
            )}
            
            {error && (
              <div className="mx-auto w-full max-w-md bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-center text-sm">
                {error}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative max-w-4xl mx-auto flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Ask me anything..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none min-h-[52px] max-h-32 text-white placeholder-gray-500 transition-all"
            rows={1}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:shadow-none"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-gray-500">AI can make mistakes. Tarik Bhai AI Assistant v2.0.</p>
        </div>
      </div>
    </div>
  );
}
