import { useState, useEffect } from 'react';
import { Save, ShieldCheck, Lock, Palette, MessageSquare, Bot, Key, Zap, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [aiName, setAiName] = useState('Tarik Bhai AI');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi, I am an advanced AI assistant built to help you with coding, writing, research, and more.');
  const [themeMode, setThemeMode] = useState('Dark');
  const [primaryColor, setPrimaryColor] = useState('Cyan');
  const [maxLength, setMaxLength] = useState(2000);
  const [temperature, setTemperature] = useState(0.7);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fake load to simulate premium feel
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved securely.');
    }, 800);
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="text-cyan-400" size={32} />
            System Configuration
          </h1>
          <p className="text-gray-400 mt-2">Manage AI persona, security, and interface preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Persona Settings */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-violet-500/20 text-violet-400 rounded-lg"><Bot size={20} /></div>
            <h2 className="text-xl font-semibold text-white">AI Persona</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">AI Name</label>
              <input 
                type="text" 
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Welcome Message</label>
              <textarea 
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Security & API */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><Lock size={20} /></div>
            <h2 className="text-xl font-semibold text-white">Security & API</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 items-start">
              <ShieldCheck className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-200">
                For ultimate security, API keys are never exposed to the frontend. All models and keys are strictly managed via backend environment variables.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                <span>Gemini API Key</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Secure (ENV)</span>
              </label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between opacity-70">
                <span className="text-gray-400 text-sm tracking-widest">••••••••••••••••••••••••••••</span>
                <Key size={16} className="text-gray-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center justify-between">
                <span>Active Model</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase">Secure (ENV)</span>
              </label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between opacity-70">
                <span className="text-gray-400 text-sm">gemini-2.0-flash</span>
                <Zap size={16} className="text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Interface & Theme */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Palette size={20} /></div>
            <h2 className="text-xl font-semibold text-white">Interface</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Theme Mode</label>
                <select 
                  value={themeMode}
                  onChange={(e) => setThemeMode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                >
                  <option value="Dark">Dark Premium</option>
                  <option value="Light">Light Clean</option>
                  <option value="System">System Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Primary Color</label>
                <select 
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                >
                  <option value="Cyan">Cyan Glow</option>
                  <option value="Violet">Deep Violet</option>
                  <option value="Emerald">Matrix Emerald</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
              <div>
                <p className="font-medium text-white">Local Chat History</p>
                <p className="text-xs text-gray-400">Save chat locally in browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={historyEnabled} onChange={(e) => setHistoryEnabled(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Model Generation Settings */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><MessageSquare size={20} /></div>
            <h2 className="text-xl font-semibold text-white">Generation Parameters</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-300">Max Response Length</label>
                <span className="text-sm text-cyan-400">{maxLength} tokens</span>
              </div>
              <input 
                type="range" min="100" max="4000" step="100" 
                value={maxLength} onChange={(e) => setMaxLength(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium text-gray-300">Temperature (Creativity)</label>
                <span className="text-sm text-cyan-400">{temperature.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05" 
                value={temperature} onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400" 
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
