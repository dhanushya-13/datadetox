import React from 'react';
import { motion } from 'motion/react';
import { Cloud, Upload, HardDrive, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface CloudProvider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync?: string;
  storageUsed?: string;
}

interface DataSourcesViewProps {
  onRefresh?: () => Promise<void>;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({ onRefresh }) => {
  const [providers, setProviders] = React.useState<CloudProvider[]>([
    { id: 'google_drive', name: 'Google Drive', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', connected: false },
    { id: 'dropbox', name: 'Dropbox', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg', connected: false },
    { id: 'onedrive', name: 'OneDrive', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019-present%29.svg', connected: false },
  ]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadResult, setUploadResult] = React.useState<{
    count: number;
    aiSummary: string;
    analysis: any[];
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  React.useEffect(() => {
    const fetchConnections = async () => {
      if (!user.id) return;
      try {
        const connections = await apiFetch<any[]>(`/api/connections/${user.id}`);
        setProviders(prev => prev.map(p => {
          const conn = connections.find(c => c.provider_id === p.id);
          return conn ? {
            ...p,
            connected: conn.connected === 1,
            lastSync: conn.last_sync ? new Date(conn.last_sync).toLocaleString() : undefined,
            storageUsed: conn.storage_used
          } : p;
        }));
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      }
    };
    fetchConnections();
  }, [user.id]);

  const handleConnect = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider?.connected) {
      // Disconnect
      try {
        await apiFetch('/api/connections/disconnect', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, providerId }),
        });
        setProviders(prev => prev.map(p => p.id === providerId ? { ...p, connected: false } : p));
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
      return;
    }

    try {
      if (providerId === 'google_drive') {
        const response = await fetch(`/api/auth/google/url?userId=${user.id}`);
        const { url } = await response.json();
        
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const authWindow = window.open(
          url,
          'oauth_popup',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        if (!authWindow) {
          alert('Please allow popups to connect your account.');
          return;
        }

        const handleMessage = (event: MessageEvent) => {
          if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.provider === providerId) {
            setProviders(prev => prev.map(p => p.id === providerId ? { 
              ...p, 
              connected: true, 
              lastSync: new Date().toLocaleString(),
              storageUsed: '14.2 GB'
            } : p));
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);
      } else {
        // Simulate other providers for now but save to DB
        await apiFetch('/api/connections/connect', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, providerId }),
        });
        setProviders(prev => prev.map(p => p.id === providerId ? { 
          ...p, 
          connected: true, 
          lastSync: new Date().toLocaleString(),
          storageUsed: '8.5 GB'
        } : p));
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    formData.append('userId', user.id);
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setUploadResult(data);
        if (onRefresh) await onRefresh();
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1000);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  };

  const handleSync = async (providerId: string) => {
    if (providerId !== 'google_drive') return;
    try {
      await apiFetch('/api/drive/sync', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      setProviders(prev => prev.map(p => p.id === providerId ? { 
        ...p, 
        lastSync: new Date().toLocaleString()
      } : p));
      if (onRefresh) await onRefresh();
      alert('Google Drive sync complete. New files indexed.');
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 font-serif italic">Data Sources</h1>
        <p className="text-zinc-400 font-medium text-sm tracking-wide uppercase">Connect and manage your digital footprint</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cloud Connections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Cloud size={20} className="text-zinc-900" />
            <h2 className="text-lg font-bold tracking-tight">Cloud Integrations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider) => (
              <motion.div
                key={provider.id}
                whileHover={{ y: -4 }}
                className="glass-card rounded-[2rem] p-8 bg-white flex flex-col items-center text-center space-y-6 relative overflow-hidden"
              >
                {provider.connected && (
                  <div className="absolute top-0 right-0 p-6 flex gap-2">
                    {provider.id === 'google_drive' && (
                      <button 
                        onClick={() => handleSync(provider.id)}
                        className="p-2 bg-brand-50 rounded-xl text-brand-400 hover:text-brand-600 transition-colors"
                        title="Sync Now"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                    <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse mt-2" />
                  </div>
                )}
                
                <div className="w-16 h-16 rounded-2xl bg-brand-50 p-3 flex items-center justify-center border border-brand-100">
                  <img src={provider.icon} alt={provider.name} className="w-full h-full object-contain" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-lg">{provider.name}</h4>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest">
                    {provider.connected ? `Last synced: ${provider.lastSync}` : 'Not connected'}
                  </p>
                  {provider.connected && provider.storageUsed && (
                    <p className="text-xs font-bold text-brand-700 mt-2">
                      {provider.storageUsed} indexed
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleConnect(provider.id)}
                  className={cn(
                    "w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    provider.connected
                      ? "bg-accent-50 text-accent-600 border border-accent-100"
                      : "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-200"
                  )}
                >
                  {provider.connected ? (
                    <>
                      <Check size={14} />
                      Connected
                    </>
                  ) : (
                    <>
                      <Cloud size={14} />
                      Connect
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Manual Upload */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <HardDrive size={20} className="text-zinc-900" />
            <h2 className="text-lg font-bold tracking-tight">Local Storage</h2>
          </div>

          <div className="glass-card rounded-[2rem] p-8 bg-white h-[calc(100%-3rem)] flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center border border-brand-100 relative">
                {isUploading ? (
                  <RefreshCw size={24} className="text-brand-500 animate-spin" />
                ) : (
                  <Upload size={24} className="text-brand-500" />
                )}
                {isUploading && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50" cy="50" r="48"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="50" cy="50" r="48"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="4"
                      strokeDasharray="301.59"
                      strokeDashoffset={301.59 - (uploadProgress / 100) * 301.59}
                      className="transition-all duration-300 ease-out"
                    />
                  </svg>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg">Manual Upload</h3>
                <p className="text-xs text-muted max-w-[200px] mx-auto leading-relaxed">
                  Upload specific files or folders for immediate neural analysis.
                </p>
              </div>

              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />

              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-4 bg-brand-500 text-white rounded-2xl text-xs font-bold tracking-widest uppercase hover:bg-brand-600 transition-all shadow-xl shadow-brand-200 disabled:opacity-50 disabled:shadow-none"
              >
                {isUploading ? `Uploading ${uploadProgress}%` : 'Select Files'}
              </button>
            </div>

            {uploadResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-brand-50 rounded-2xl border border-brand-100 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-brand-700">Analysis Result</h4>
                  <button 
                    onClick={() => setUploadResult(null)}
                    className="text-[10px] font-bold text-brand-400 uppercase tracking-widest hover:text-brand-600"
                  >
                    Dismiss
                  </button>
                </div>
                
                <p className="text-xs text-brand-600 leading-relaxed italic">
                  "{uploadResult.aiSummary}"
                </p>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Findings ({uploadResult.analysis.filter(a => a.flagged).length})</p>
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {uploadResult.analysis.filter(a => a.flagged).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded-lg border border-brand-100">
                        <AlertCircle size={12} className={cn(
                          "mt-0.5 shrink-0",
                          item.risk === 'high' ? "text-red-500" : "text-amber-500"
                        )} />
                        <div>
                          <p className="text-[10px] font-bold text-brand-700 truncate">{item.name}</p>
                          <p className="text-[9px] text-muted leading-tight">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                    {uploadResult.analysis.filter(a => a.flagged).length === 0 && (
                      <p className="text-[10px] text-brand-400 italic">No immediate concerns found in this batch.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
