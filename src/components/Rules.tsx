import { useState, useEffect } from 'react';
import { Phone, CheckCircle, AlertTriangle, RefreshCw, Smartphone, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Rules() {
  const [wsStatus, setWsStatus] = useState<'DISCONNECTED' | 'QR_CODE' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendUrl] = useState(localStorage.getItem('WP_BOT_BACKEND_URL') || '');

  const getApiUrl = (path: string) => {
    const backendUrl = "https://wp-ai-1.onrender.com";
    return `${backendUrl}${path}`;
  };

  // Poll WhatsApp Status
  useEffect(() => {
    let interval: any;
    const checkStatus = () => {
      fetch(getApiUrl('/api/status'))
        .then(res => res.json())
        .then(data => {
          setWsStatus(data.status);
          setQrCode(data.qrCode);
          setConnectionError(data.error);
          setLoading(false);
        })
        .catch(err => {
          console.error("Status check failed:", err);
          setConnectionError("Cannot reach backend server");
          setLoading(false);
        });
    };

    checkStatus();
    interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const connectWhatsApp = async () => {
    setWsStatus('CONNECTING');
    setConnectionError(null);
    try {
      await fetch(getApiUrl('/api/connect'), { method: 'POST' });
    } catch (err: any) {
      setConnectionError("Failed to start WhatsApp bot");
      setWsStatus('DISCONNECTED');
    }
  };

  const getStatusDisplay = () => {
    if (loading) return { text: "Waking up Server...", color: "text-gray-400", bg: "bg-gray-500/10", icon: <RefreshCw className="animate-spin" size={24} /> };
    switch (wsStatus) {
      case 'CONNECTED':
        return { text: "Bot Active", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle size={24} /> };
      case 'CONNECTING':
      case 'QR_CODE':
        return { text: "Connecting...", color: "text-amber-400", bg: "bg-amber-500/10", icon: <RefreshCw className="animate-spin" size={24} /> };
      case 'DISCONNECTED':
      default:
        return { text: "Disconnected", color: "text-red-400", bg: "bg-red-500/10", icon: <AlertTriangle size={24} /> };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Phone className="text-cyan-400" size={32} />
            WhatsApp Bot
          </h1>
          <p className="text-gray-400 mt-2">Manage your autonomous WhatsApp responder</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Smartphone size={20} /></div>
            <h2 className="text-xl font-semibold text-white">Connection Status</h2>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className={`p-4 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
              {statusInfo.icon}
            </div>
            <h3 className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.text}</h3>
            {connectionError && (
              <p className="text-sm text-red-400 bg-red-500/10 px-3 py-1 rounded-lg text-center">
                {connectionError}
              </p>
            )}

            {wsStatus === 'DISCONNECTED' && (
              <button 
                onClick={connectWhatsApp}
                className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 w-full"
              >
                Start WhatsApp Bot
              </button>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><QrCode size={20} /></div>
            <h2 className="text-xl font-semibold text-white">Device Linking</h2>
          </div>

          <div className="flex flex-col items-center justify-center py-2 h-full min-h-[200px]">
            {wsStatus === 'QR_CODE' && qrCode ? (
              <div className="space-y-4 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                <div className="bg-white p-4 rounded-2xl">
                  <QRCodeSVG value={qrCode} size={180} />
                </div>
                <p className="text-sm text-gray-400 text-center">Scan with WhatsApp to link device</p>
              </div>
            ) : wsStatus === 'CONNECTED' ? (
              <div className="space-y-4 flex flex-col items-center text-center">
                <CheckCircle className="text-emerald-400" size={48} />
                <p className="text-gray-300">Device linked successfully.</p>
                <p className="text-sm text-gray-500">The bot is actively listening for messages.</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <QrCode className="text-gray-600 mx-auto" size={48} />
                <p className="text-gray-500">No QR Code available.</p>
                <p className="text-sm text-gray-600">Start the bot to generate a linking code.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
