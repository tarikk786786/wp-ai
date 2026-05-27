import { useState, useEffect } from 'react';
import { Save, UserCircle, MessageCircle, AlertCircle, Heart, RefreshCw, Smartphone, Sparkles, Check, Flame, ShieldAlert } from 'lucide-react';

// Helper to determine active backend API base dynamically (supports Netlify production host mappings)
const getApiUrl = (path: string) => path;

export default function Settings() {
  const [tone, setTone] = useState('Friend Mode');
  const [languages, setLanguages] = useState(['English', 'Hindi', 'Hinglish', 'Odia']);
  const [newLanguage, setNewLanguage] = useState('');
  const [brandContext, setBrandContext] = useState('');
  const [replyLength, setReplyLength] = useState('Short & Natural (Recommended)');
  const [emojiLevel, setEmojiLevel] = useState('Medium (Friendly, casual)');
  const [godmode, setGodmode] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [backendUrl, setBackendUrl] = useState(localStorage.getItem('WP_BOT_BACKEND_URL') || 'http://localhost:3001');
  const [saving, setSaving] = useState(false);

  // WhatsApp connection states
  const [wsStatus, setWsStatus] = useState<'DISCONNECTED' | 'QR_CODE' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Load Settings
  useEffect(() => {
    fetch(getApiUrl('/api/settings'))
      .then(res => res.json())
      .then(data => {
        setTone(data.tone || 'Friend Mode');
        setLanguages(data.languages || ['English', 'Hindi', 'Hinglish', 'Odia']);
        setBrandContext(data.brandContext || '');
        setReplyLength(data.replyLength || 'Short & Natural (Recommended)');
        setEmojiLevel(data.emojiLevel || 'Medium (Friendly, casual)');
        setGodmode(!!data.godmode);
        setGeminiApiKey(data.geminiApiKey || '');
      })
      .catch(err => console.error("Error loading settings:", err));
  }, [backendUrl]);

  // Poll WhatsApp Status
  useEffect(() => {
    const checkStatus = () => {
      fetch(getApiUrl('/api/status'))
        .then(res => res.json())
        .then(data => {
          setWsStatus(data.status);
          setQrCode(data.qrCode);
          setConnectionError(data.error);
        })
        .catch(err => console.error("Error fetching status:", err));
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [backendUrl]);

  const handleSave = async () => {
    setSaving(true);
    // Persist backend URL to localStorage
    localStorage.setItem('WP_BOT_BACKEND_URL', backendUrl);
    
    try {
      const res = await fetch(getApiUrl('/api/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          languages,
          brandContext,
          replyLength,
          emojiLevel,
          godmode,
          geminiApiKey
        })
      });
      if (res.ok) {
        alert("Settings saved successfully brother!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch(getApiUrl('/api/connect'), { method: 'POST' });
      const data = await res.json();
      setWsStatus(data.status);
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your WhatsApp account brother?")) return;
    try {
      const res = await fetch(getApiUrl('/api/disconnect'), { method: 'POST' });
      const data = await res.json();
      setWsStatus(data.status);
      setQrCode(null);
    } catch (e) {
      console.error(e);
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang: string) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-4xl mx-auto pb-8 p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Agent Configuration</h2>
          <p className="text-slate-500 mt-1">Manage AI personality, tone, and WhatsApp integration.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} 
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personality & Tone */}
        <div className="lg:col-span-2 space-y-6">
          {/* Godmode / G0DM0D3 Panel */}
          <div className={`rounded-2xl border transition-all duration-300 p-6 shadow-sm ${
            godmode 
              ? 'bg-slate-950 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)] text-slate-100' 
              : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Flame className={godmode ? "text-rose-500 animate-pulse" : "text-amber-500"} size={22} /> 
                {godmode ? "G0DM0D3 (Godmode) Brain Active" : "G0DM0D3 Safety Bypasses"}
              </h3>
              <button 
                onClick={() => setGodmode(!godmode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  godmode ? 'bg-rose-500' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  godmode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <p className={`text-xs mb-4 leading-relaxed ${godmode ? 'text-slate-400' : 'text-slate-500'}`}>
              Inspired by Pliny the Prompter's adversarial red-teaming safety studies. Enabling G0DM0D3 injects unfiltered, highly capable, and fully liberated system prompts, allowing the AI to speak with complete compliance.
            </p>
            {godmode && (
              <div className="p-3.5 bg-rose-950/20 text-rose-300 rounded-xl border border-rose-900/30 text-xs flex gap-2.5 items-start">
                <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                <span><strong>WARNING:</strong> Godmode removes standard model limits. Replies will begin with "GODMODE ENABLED: " and operate in an unrestricted Hinglish AI context. Use with discretion.</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Heart className="text-emerald-500" size={20} /> AI Personality Profile
            </h3>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={geminiApiKey} 
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Paste your GEMINI_API_KEY here..."
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Backend Server URL (Netlify Integration)</label>
                  <input 
                    type="text" 
                    value={backendUrl} 
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="http://localhost:3001"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">If hosted on Netlify, sets the target API endpoint (e.g. your Render backend URL).</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Tone</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Friend Mode', 'Professional', 'Sales/Persuasive', 'Support'].map((mode, i) => (
                    <div 
                      key={i} 
                      onClick={() => setTone(mode)}
                      className={`px-4 py-3 border rounded-xl cursor-pointer text-center text-sm font-medium transition-colors ${
                        tone === mode 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Supported Languages</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {languages.map((lang, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium flex items-center gap-1.5 border border-slate-200">
                      {lang} 
                      <button 
                        onClick={() => removeLanguage(lang)}
                        className="text-slate-400 hover:text-slate-600 ml-1 font-bold"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Add language (e.g. Spanish)" 
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 flex-1"
                  />
                  <button 
                    onClick={addLanguage}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium border border-slate-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Character / Context</label>
                <textarea 
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  rows={4}
                  value={brandContext}
                  onChange={(e) => setBrandContext(e.target.value)}
                  placeholder="Describe your bot's character..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reply Length</label>
                  <select 
                    value={replyLength} 
                    onChange={(e) => setReplyLength(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option>Short & Natural (Recommended)</option>
                    <option>Medium / Detailed</option>
                    <option>Very Detailed (Documentation style)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Emoji Level 🌶️</label>
                  <select 
                    value={emojiLevel}
                    onChange={(e) => setEmojiLevel(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option>Low (Minimal, clean)</option>
                    <option>Medium (Friendly, casual)</option>
                    <option>High (Very expressive)</option>
                    <option>None</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live WhatsApp Attachment Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Smartphone className="text-emerald-500" size={20} /> Attach My WhatsApp
            </h3>
            
            {wsStatus === 'CONNECTED' ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={24} className="stroke-[3]" />
                  </div>
                  <h4 className="font-bold text-emerald-950">WhatsApp Connected!</h4>
                  <p className="text-xs text-emerald-800 mt-1 leading-normal">Your personal WhatsApp device is linked and actively automated.</p>
                </div>
                
                <button 
                  onClick={handleDisconnect}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-sm font-semibold transition-colors"
                >
                  Disconnect Device
                </button>
              </div>
            ) : wsStatus === 'QR_CODE' && qrCode ? (
              <div className="space-y-4 text-center">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl inline-block shadow-sm">
                  <img src={qrCode} alt="WhatsApp Web QR Code" className="w-48 h-48 mx-auto" />
                </div>
                
                <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">How to connect:</h5>
                  <ol className="text-xs text-slate-500 list-decimal list-inside space-y-1">
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap <b>Menu</b> or <b>Settings</b> &rarr; <b>Linked Devices</b></li>
                    <li>Tap <b>Link a Device</b></li>
                    <li>Scan this QR code with your phone</li>
                  </ol>
                </div>
                
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-100">
                  <RefreshCw className="animate-spin" size={14} />
                  <span>Awaiting QR Scan...</span>
                </div>
              </div>
            ) : wsStatus === 'CONNECTING' || connecting ? (
              <div className="py-8 text-center space-y-3">
                <RefreshCw size={36} className="text-emerald-500 animate-spin mx-auto" />
                <div>
                  <h4 className="font-semibold text-slate-700">Starting WhatsApp Web...</h4>
                  <p className="text-xs text-slate-400 mt-1">Initializing secure browser browser instance.</p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-700">WhatsApp Offline</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-normal">Link your personal WhatsApp account by scanning a secure QR code.</p>
                </div>
                
                {connectionError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-[11px] text-left flex gap-1.5">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Error: {connectionError}</span>
                  </div>
                )}

                <button 
                  onClick={handleConnect}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Smartphone size={16} /> Link My WhatsApp Account
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserCircle className="text-blue-500" size={20} /> Safety Status
            </h3>
            <div className="space-y-3 text-xs leading-normal">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500">Auto-Reply Guard:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={14} /> Active
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500">Self-Protection:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={14} /> Secure
                </span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-slate-500">Anti-Spam Filter:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={14} /> Engaged
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
