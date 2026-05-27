import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Zap, AlertTriangle, ShieldCheck, Flame, Moon, RefreshCw } from 'lucide-react';

type Rule = {
  name: string;
  desc: string;
  enabled: boolean;
};

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

export default function Rules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Map icon based on rule name
  const getRuleIcon = (name: string) => {
    switch (name) {
      case "Angry Customer Routing": return <ShieldAlert className="text-red-500" />;
      case "Price Inquiry Auto-Reply": return <Zap className="text-blue-500" />;
      case "Lead Follow-up": return <Flame className="text-orange-500" />;
      case "Away Message (Night)": return <Moon className="text-indigo-500" />;
      case "Spam Protection Filter": return <ShieldCheck className="text-emerald-500" />;
      default: return <AlertTriangle className="text-amber-500" />;
    }
  };

  // Load Rules
  useEffect(() => {
    const fetchRules = () => {
      fetch(getApiUrl('/api/rules'))
        .then(res => res.json())
        .then(data => {
          setRules(data);
          setLoading(false);
        })
        .catch(err => console.error("Error fetching rules:", err));
    };
    fetchRules();
  }, []);

  // Toggle Rule
  const handleToggle = async (index: number) => {
    const updatedRules = [...rules];
    updatedRules[index].enabled = !updatedRules[index].enabled;
    setRules(updatedRules);

    try {
      await fetch(getApiUrl('/api/rules'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRules)
      });
    } catch (e) {
      console.error("Error saving toggle status:", e);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
        <RefreshCw className="animate-spin text-emerald-500 mb-3" size={32} />
        <span className="font-semibold text-sm">Syncing safety guidelines brother...</span>
      </div>
    );
  }

  return (
    <div className="h-full max-w-4xl mx-auto space-y-6 flex flex-col p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Safety & Auto Rules</h2>
          <p className="text-slate-500 mt-1">Configure boundary conditions for how AI acts.</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Plus size={18} /> Create New Rule
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <ShieldCheck size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Active Boundary Constraints</h3>
            <p className="text-sm text-slate-500">Rules executed before generating standard replies.</p>
          </div>
        </div>
        
        <div className="divide-y divide-slate-100 bg-white">
          {rules.map((rule, idx) => (
            <div key={idx} className="p-5 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  {getRuleIcon(rule.name)}
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">{rule.name}</h4>
                  <p className="text-sm text-slate-500 mt-0.5">{rule.desc}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleToggle(idx)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rule.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">About Safety Rules</h4>
          <p className="text-sm text-blue-800/80 leading-relaxed font-medium">
            These rules act as "guardrails" for your Friendly AI Agent. If a user asks the AI for something completely irrelevant, illegal, or tries to jailbreak it, these rules will block the API and trigger a Human Takeover alert instead. Custom "Godmode" triggers will bypass standard blocks only if enabled in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
