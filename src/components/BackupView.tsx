import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, HardDrive, Shield, Clock, Plus, CheckCircle2, AlertCircle, RefreshCw, Download, RotateCcw, FileText, Video, Image, Mail, File, ChevronDown, ChevronUp, Eye, X, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface BackupItem {
  id: number;
  name: string;
  size: number;
  file_type: string;
  original_path: string;
  content?: string;
}

interface Backup {
  id: number;
  name: string;
  size: number;
  status: string;
  created_at: string;
  items?: BackupItem[];
  isExpanded?: boolean;
}

interface BackupViewProps {
  onRefresh?: () => Promise<void>;
}

export const BackupView: React.FC<BackupViewProps> = ({ onRefresh }) => {
  const [backups, setBackups] = React.useState<Backup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [lastIntegrityCheck, setLastIntegrityCheck] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastCloudSync, setLastCloudSync] = React.useState<string | null>(null);
  const [viewingItem, setViewingItem] = React.useState<BackupItem | null>(null);
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<number | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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
          name: `Neural_Snapshot_${new Date().toISOString().split('T')[0]}_${Math.floor(Math.random() * 1000)}`
        }),
      });
      await fetchBackups();
      showNotification('Neural Snapshot created successfully.');
    } catch (err) {
      console.error('Failed to create backup:', err);
      showNotification('Failed to create snapshot.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsVerifying(true);
    try {
      const result = await apiFetch<any>('/api/snapshots/verify', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      setLastIntegrityCheck(new Date(result.lastCheck).toLocaleString());
      showNotification(`Neural Integrity Check Complete: System state is ${result.integrityScore}% consistent.`);
    } catch (err) {
      console.error('Verification failed:', err);
      showNotification('Integrity check failed.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCloudSync = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsSyncing(true);
    try {
      await apiFetch('/api/drive/sync', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      setLastCloudSync(new Date().toLocaleString());
      showNotification('Cloud Sync Complete: Snapshots synchronized.');
    } catch (err) {
      console.error('Sync failed:', err);
      showNotification('Cloud sync failed.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async (snapshotId: number) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      const result = await apiFetch<any>('/api/snapshots/restore', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, snapshotId }),
      });
      showNotification(result.message || 'System state restored successfully. Files are now available in your Cleanup Center.');
      if (onRefresh) {
        await onRefresh();
      } else {
        await fetchBackups();
      }
    } catch (err) {
      console.error('Restore failed:', err);
      showNotification('Failed to restore snapshot.', 'error');
    }
  };

  const handleDeleteSnapshot = async (snapshotId: number) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      await apiFetch(`/api/backups/${snapshotId}?userId=${user.id}`, {
        method: 'DELETE',
      });
      await fetchBackups();
      showNotification('Snapshot permanently deleted from history.');
      setConfirmDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
      showNotification('Failed to delete snapshot.', 'error');
    }
  };

  const handleDownloadSnapshot = async (backup: Backup) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      // 1. Process for Cleanup Center (as requested)
      await apiFetch<any>('/api/snapshots/restore', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, snapshotId: backup.id }),
      });

      // 2. Trigger actual browser download of the metadata
      const items = await apiFetch<any[]>(`/api/backups/${backup.id}/items`);
      const exportData = {
        snapshot: backup,
        items: items,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.name.replace(/\s+/g, '_')}_export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification(`Snapshot "${backup.name}" processed and downloaded.`);
      if (onRefresh) {
        await onRefresh();
      } else {
        await fetchBackups();
      }
    } catch (err) {
      console.error('Download/Restore failed:', err);
      showNotification('Failed to process snapshot download.', 'error');
    }
  };

  const handleDeleteItem = async (backupId: number, itemId: number) => {
    try {
      await apiFetch(`/api/backups/${backupId}/items/${itemId}`, {
        method: 'DELETE',
      });
      await fetchBackups();
      setBackups(prev => prev.map(b => 
        b.id === backupId ? { ...b, isExpanded: true } : b
      ));
      showNotification('Item removed from snapshot.');
    } catch (err) {
      console.error('Delete item failed:', err);
      showNotification('Failed to remove item.', 'error');
    }
  };

  const handleRestoreItem = async (backupId: number, itemId: number) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      await apiFetch(`/api/backups/${backupId}/items/${itemId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      showNotification('Item restored successfully. It is now available in your Cleanup Center.');
      if (onRefresh) {
        await onRefresh();
      }
      await fetchBackups();
    } catch (err) {
      console.error('Restore item failed:', err);
      showNotification('Failed to restore item.', 'error');
    }
  };

  const toggleExpand = async (backupId: number) => {
    const backup = backups.find(b => b.id === backupId);
    if (!backup) return;

    if (!backup.items) {
      try {
        const items = await apiFetch<BackupItem[]>(`/api/backups/${backupId}/items`);
        setBackups(prev => prev.map(b => 
          b.id === backupId ? { ...b, items: items || [], isExpanded: !b.isExpanded } : b
        ));
      } catch (err) {
        console.error('Failed to fetch backup items:', err);
      }
    } else {
      setBackups(prev => prev.map(b => 
        b.id === backupId ? { ...b, isExpanded: !b.isExpanded } : b
      ));
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image size={14} />;
      case 'video': return <Video size={14} />;
      case 'document': return <FileText size={14} />;
      case 'email': return <Mail size={14} />;
      default: return <File size={14} />;
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
        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card rounded-[2rem] p-8 bg-white space-y-4 relative group"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Neural Integrity</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">Your data is encrypted and distributed across secure nodes.</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                {lastIntegrityCheck ? `Last: ${lastIntegrityCheck}` : 'Not checked'}
              </span>
              <button 
                onClick={handleVerifyIntegrity}
                disabled={isVerifying}
                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50"
              >
                {isVerifying ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card rounded-[2rem] p-8 bg-white space-y-4 relative group"
        >
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Cloud Sync</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">Automatic synchronization with your connected cloud providers.</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                {lastCloudSync ? `Last: ${lastCloudSync}` : 'Idle'}
              </span>
              <button 
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="p-2 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="glass-card rounded-[2rem] p-8 bg-white space-y-4 relative group"
        >
          <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Point-in-Time</h3>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">Restore your digital footprint to any previous state.</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                {backups.length} points available
              </span>
              <div className="p-2 bg-zinc-50 text-zinc-400 rounded-xl">
                <RotateCcw size={14} />
              </div>
            </div>
          </div>
        </motion.div>
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
              <div key={backup.id} className="divide-y divide-zinc-50">
                <div className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleExpand(backup.id)}
                      className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-white group-hover:text-zinc-900 transition-all"
                    >
                      {backup.isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
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
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDownloadSnapshot(backup)}
                        className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                        title="Download Snapshot"
                      >
                        <Download size={18} />
                      </button>
                      <button 
                        onClick={() => handleRestore(backup.id)}
                        className="p-2 text-zinc-400 hover:text-brand-600 transition-colors"
                        title="Restore to this point"
                      >
                        <RotateCcw size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(backup.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Delete Snapshot"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {backup.isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-50/50"
                    >
                      <div className="p-6 pl-20 space-y-6">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Archived Items ({backup.items?.length || 0})</p>
                          <button 
                            onClick={() => handleRestore(backup.id)}
                            className="flex items-center gap-2 px-4 py-1.5 bg-brand-50 text-brand-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-100 transition-all"
                          >
                            <RotateCcw size={12} />
                            Restore Full Snapshot
                          </button>
                        </div>
                        {backup.items && backup.items.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {backup.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm group/item">
                                <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                                  {getFileIcon(item.file_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-zinc-900 truncate">{item.name}</p>
                                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest truncate">{item.original_path}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-zinc-500">{(item.size / (1024 * 1024)).toFixed(2)} MB</span>
                                  {item.content && (
                                    <button 
                                      onClick={() => setViewingItem(item)}
                                      className="p-1.5 text-zinc-300 hover:text-zinc-900 transition-colors"
                                      title="View Content"
                                    >
                                      <Eye size={14} />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleRestoreItem(backup.id, item.id)}
                                    className="p-1.5 text-zinc-300 hover:text-brand-600 transition-colors"
                                    title="Restore Item"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteItem(backup.id, item.id)}
                                    className="p-1.5 text-zinc-300 hover:text-rose-600 transition-colors"
                                    title="Delete Item"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 italic">No individual items recorded for this snapshot.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              notification.type === 'success' 
                ? "bg-emerald-500/90 text-white border-emerald-400" 
                : "bg-rose-500/90 text-white border-rose-400"
            )}
          >
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <p className="text-sm font-bold tracking-tight">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Delete Snapshot?</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  This action is permanent and cannot be undone. The snapshot will be removed from your history.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-6 py-3 bg-zinc-100 text-zinc-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSnapshot(confirmDelete)}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingItem(null)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900">
                    {viewingItem.file_type === 'email' ? <Mail size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">{viewingItem.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{viewingItem.original_path}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingItem(null)}
                  className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-2xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                  <pre className="text-sm text-zinc-600 font-mono whitespace-pre-wrap leading-relaxed">
                    {viewingItem.content}
                  </pre>
                </div>
              </div>
              <div className="p-8 bg-zinc-50/50 border-t border-zinc-100 flex justify-end">
                <button 
                  onClick={() => setViewingItem(null)}
                  className="px-8 py-3 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
