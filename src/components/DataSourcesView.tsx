import React from 'react';
import { motion } from 'motion/react';
import { Cloud, Upload, HardDrive, Check, AlertCircle, RefreshCw, PieChart as PieChartIcon, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import Markdown from 'react-markdown';
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
  user: any;
  onRefresh?: () => Promise<void>;
}

export const DataSourcesView: React.FC<DataSourcesViewProps> = ({ user, onRefresh }) => {
  const [providers, setProviders] = React.useState<CloudProvider[]>([
    { id: 'google_drive', name: 'Google Drive', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg', connected: false },
    { id: 'dropbox', name: 'Dropbox', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Dropbox_Icon.svg', connected: false },
    { id: 'onedrive', name: 'OneDrive', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019-present%29.svg', connected: false },
  ]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadResult, setUploadResult] = React.useState<{
    count: number;
    report: string;
    analysis: any[];
    visualization: {
      typeDistribution: { name: string; value: number }[];
      totalSize: number;
    };
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    formData.append('userId', user.id);
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    console.log('Initiating upload to /api/upload', {
      userId: user.id,
      filesCount: files.length,
      token: !!localStorage.getItem('token')
    });

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

      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          const text = await response.text();
          console.error('Failed to parse successful response as JSON:', text);
          throw new Error('Server returned a successful status but invalid JSON response.');
        }
        
        try {
          // Perform AI analysis on frontend
          const { GoogleGenAI } = await import("@google/genai");
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const prompt = `
            Analyze these manually uploaded files for a Digital Detox platform:
            ${data.fileSummary}
            
            Provide a concise report including:
            1. A summary of the upload (wordings).
            2. A "Neural Impact" score for this specific batch.
            3. Recommendations for these specific files.
            Use a sophisticated, slightly futuristic tone.
          `;

          const aiResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: prompt }] }],
          });

          setUploadResult({
            ...data,
            report: aiResponse.text
          });
        } catch (aiError) {
          console.error('AI Analysis failed:', aiError);
          setUploadResult({
            ...data,
            report: "Neural analysis link failed. Files indexed successfully, but AI report unavailable at this moment."
          });
        }

        if (onRefresh) await onRefresh();
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1000);
      } else {
        let errorMessage = `Upload failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          if (text.includes('<!doctype html>')) {
            errorMessage = "Server returned an HTML error page. This usually indicates a routing or proxy issue.";
          } else {
            errorMessage = text.substring(0, 100) || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload Error: ${error.message}`);
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChartIcon size={18} className="text-brand-500" />
                    <h4 className="text-sm font-bold text-brand-700 uppercase tracking-widest">Neural Analysis Report</h4>
                  </div>
                  <button 
                    onClick={() => setUploadResult(null)}
                    className="text-[10px] font-bold text-brand-400 uppercase tracking-widest hover:text-brand-600"
                  >
                    Dismiss
                  </button>
                </div>

                {/* Visualization */}
                <div className="h-48 w-full bg-brand-50/30 rounded-3xl border border-brand-100 p-4 flex items-center">
                  <div className="w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={uploadResult.visualization.typeDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {uploadResult.visualization.typeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'][index % 5]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-2">
                    <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-2">Distribution</p>
                    {uploadResult.visualization.typeDistribution.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px]">
                        <span className="font-medium text-zinc-500 capitalize">{item.name}</span>
                        <span className="font-bold text-zinc-900">{item.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-brand-100 mt-2">
                      <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Total Size</p>
                      <p className="text-xs font-bold text-brand-700">{(uploadResult.visualization.totalSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                </div>
                
                {/* AI Report */}
                <div className="p-6 bg-white rounded-3xl border border-brand-100 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-brand-500" />
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">AI Insights</span>
                  </div>
                  <div className="markdown-body text-xs text-zinc-600 leading-relaxed prose prose-sm prose-zinc">
                    <Markdown>{uploadResult.report}</Markdown>
                  </div>
                </div>

                {/* Flagged Items */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Flagged for Review ({uploadResult.analysis.filter(a => a.flagged).length})</p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {uploadResult.analysis.filter(a => a.flagged).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-brand-50/50 rounded-2xl border border-brand-100 group hover:border-brand-300 transition-all">
                        <AlertCircle size={14} className={cn(
                          "mt-0.5 shrink-0",
                          item.risk === 'high' ? "text-red-500" : "text-amber-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-brand-700 truncate">{item.name}</p>
                          <p className="text-[10px] text-zinc-500 leading-tight mt-1">{item.reason}</p>
                        </div>
                      </div>
                    ))}
                    {uploadResult.analysis.filter(a => a.flagged).length === 0 && (
                      <div className="py-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">No risks identified</p>
                      </div>
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
