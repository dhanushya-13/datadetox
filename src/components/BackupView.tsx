import React from 'react';
import { motion } from 'motion/react';
import { Cloud, HardDrive, Shield, Clock, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Backup {
  id: number;
  name: string;
  size: number;
  status: string;
  created_at: string;
}

export const BackupView: React.FC = () => {
  const [backups, setBackups] = React.useState<Backup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);

  const fetchBackups = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const data = await apiFetch<Backup[]>(`/api/backups/${user.id}`);
      if (data) setBackups(data);
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsCreating(true);
    try {
      await apiFetch('/api/backups', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          name: `Neural_Snapshot_${new Date().toISOString().split('T')[0]}`,
          size: Math.floor(Math.random() * 5000000000) + 1000000000 // 1-6 GB
        }),
      });
      await fetchBackups();
    } catch (err) {
      console.error('Failed to create backup:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex items-end justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 font-serif italic">Backup Space</h1>
          <p className="text-zinc-400 font-medium text-sm tracking-wide uppercase">Secure your digital neural state</p>
        </div>
        <button
          onClick={handleCreateBackup}
          disabled={isCreating}
          className="px-6 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 flex items-center gap-2 disabled:opacity-50"
        >
          {isCreating ? <Clock className="animate-spin" size={14} /> : <Plus size={14} />}
          {isCreating ? 'Creating Snapshot...' : 'New Snapshot'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card rounded-[2rem] p-8 bg-white space-y-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Neural Integrity</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Your data is encrypted and distributed across secure nodes.</p>
          </div>
        </div>
        <div className="glass-card rounded-[2rem] p-8 bg-white space-y-4">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Cloud Sync</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Automatic synchronization with your connected cloud providers.</p>
          </div>
        </div>
        <div className="glass-card rounded-[2rem] p-8 bg-white space-y-4">
          <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Point-in-Time</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">Restore your digital footprint to any previous state.</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[3rem] bg-white overflow-hidden border border-zinc-100">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Snapshot History</h2>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{backups.length} Total Snapshots</span>
        </div>
        
        <div className="divide-y divide-zinc-50">
          {loading ? (
            <div className="p-20 text-center">
              <Clock className="animate-spin mx-auto text-zinc-300 mb-4" size={32} />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Accessing Archives...</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="p-20 text-center">
              <AlertCircle className="mx-auto text-zinc-200 mb-4" size={48} />
              <p className="text-sm font-bold text-zinc-400">No snapshots found. Create your first backup to secure your data.</p>
            </div>
          ) : (
            backups.map((backup) => (
              <div key={backup.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-zinc-900 transition-all">
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">{backup.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                      {new Date(backup.created_at).toLocaleString()} • {formatSize(backup.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                    <CheckCircle2 size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                  </div>
                  <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                    <Clock size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
