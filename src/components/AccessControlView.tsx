import React from 'react';
import { motion } from 'motion/react';
import { Shield, Check, Lock, Eye, FileText, Camera, Video, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Permission {
  id: string;
  label: string;
  description: string;
  icon: any;
  enabled: boolean;
}

interface AccessControlViewProps {
  userId: number;
  onComplete: () => void;
}

export const AccessControlView: React.FC<AccessControlViewProps> = ({ userId, onComplete }) => {
  const [permissions, setPermissions] = React.useState<Permission[]>([
    { id: 'photos_access', label: 'Photos & Media', description: 'Analyze metadata and content of your visual assets.', icon: Camera, enabled: true },
    { id: 'videos_access', label: 'Video Archives', description: 'Deep scan video files for behavioral patterns.', icon: Video, enabled: true },
    { id: 'email_access', label: 'Communication', description: 'Review email headers and frequency for digital load.', icon: Mail, enabled: true },
    { id: 'documents_access', label: 'Documents', description: 'Index text files for knowledge graph construction.', icon: FileText, enabled: true },
    { id: 'files_access', label: 'System Files', description: 'Monitor app usage and system configuration.', icon: Lock, enabled: true },
  ]);
  const [loading, setLoading] = React.useState(false);

  const togglePermission = (id: string) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const handleGrantAccess = async () => {
    setLoading(true);
    try {
      const payload = permissions.reduce((acc, p) => ({ ...acc, [p.id]: p.enabled ? 1 : 0 }), {});
      await apiFetch('/api/permissions', {
        method: 'POST',
        body: JSON.stringify({ userId, ...payload }),
      });
      onComplete();
    } catch (error) {
      console.error('Failed to save permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl glass-card rounded-[3rem] p-12 bg-white/80 backdrop-blur-xl shadow-2xl shadow-zinc-200"
      >
        <div className="flex flex-col items-center text-center space-y-6 mb-12">
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-zinc-300">
            <Shield size={40} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter text-zinc-900 font-serif italic">Access Control</h1>
            <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest">Configure Neural Link Permissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-12">
          {permissions.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePermission(p.id)}
              className={cn(
                "flex items-center gap-6 p-6 rounded-3xl border transition-all text-left group",
                p.enabled 
                  ? "bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-200" 
                  : "bg-white border-zinc-100 text-zinc-900 hover:border-zinc-300"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                p.enabled ? "bg-white/10 text-white" : "bg-zinc-50 text-zinc-400 group-hover:text-zinc-900"
              )}>
                <p.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg leading-none mb-1">{p.label}</h3>
                <p className={cn(
                  "text-xs font-medium",
                  p.enabled ? "text-white/60" : "text-zinc-400"
                )}>{p.description}</p>
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                p.enabled ? "bg-white border-white text-zinc-900" : "border-zinc-200"
              )}>
                {p.enabled && <Check size={14} strokeWidth={3} />}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <button 
            onClick={handleGrantAccess}
            disabled={loading}
            className="w-full py-6 bg-zinc-900 text-white rounded-[2rem] font-bold text-sm tracking-widest uppercase hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-300 flex items-center justify-center gap-3 group"
          >
            {loading ? 'Configuring Neural Link...' : 'Grant Access & Start Detox'}
          </button>
          
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em]">
            <Lock size={12} />
            End-to-End Encrypted Access
          </div>
        </div>
      </motion.div>
    </div>
  );
};
