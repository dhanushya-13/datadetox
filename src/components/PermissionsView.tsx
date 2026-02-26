import React from 'react';
import { motion } from 'motion/react';
import { Shield, Image, Video, Mail, FileText, Folder, Check, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Permissions {
  photos_access: number;
  videos_access: number;
  email_access: number;
  documents_access: number;
  files_access: number;
}

export const PermissionsView: React.FC = () => {
  const [permissions, setPermissions] = React.useState<Permissions>({
    photos_access: 1,
    videos_access: 1,
    email_access: 1,
    documents_access: 1,
    files_access: 1,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const fetchPermissions = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const data = await apiFetch<Permissions>(`/api/permissions/${user.id}`);
      if (data) setPermissions(data);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPermissions();
  }, []);

  const togglePermission = async (key: keyof Permissions) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const newPermissions = { ...permissions, [key]: permissions[key] ? 0 : 1 };
    setPermissions(newPermissions);
    setSaving(true);
    
    try {
      await apiFetch('/api/permissions', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, ...newPermissions }),
      });
    } catch (err) {
      console.error('Failed to update permissions:', err);
      // Rollback on error
      setPermissions(permissions);
    } finally {
      setSaving(false);
    }
  };

  const permissionItems = [
    { key: 'photos_access' as const, label: 'Photos & Images', icon: Image, description: 'Neural indexing of visual memories and metadata.' },
    { key: 'videos_access' as const, label: 'Video Content', icon: Video, description: 'Analysis of motion-based data streams.' },
    { key: 'email_access' as const, label: 'Electronic Mail', icon: Mail, description: 'Access to communication patterns and attachments.' },
    { key: 'documents_access' as const, label: 'Documents & PDF', icon: FileText, description: 'Parsing of textual intelligence and reports.' },
    { key: 'files_access' as const, label: 'System Files', icon: Folder, description: 'Deep scan of binary and configuration data.' },
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 font-serif italic">Access Control</h1>
        <p className="text-zinc-400 font-medium text-sm tracking-wide uppercase">Manage neural permissions and data privacy</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {permissionItems.map((item) => {
          const isAllowed = permissions[item.key] === 1;
          return (
            <motion.div
              key={item.key}
              whileHover={{ x: 4 }}
              className={cn(
                "glass-card rounded-[2.5rem] p-8 bg-white flex items-center justify-between border transition-all duration-500",
                isAllowed ? "border-zinc-100" : "border-red-100 bg-red-50/10"
              )}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                  isAllowed ? "bg-zinc-900 text-white" : "bg-red-50 text-red-500"
                )}>
                  <item.icon size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{item.label}</h3>
                  <p className="text-xs text-zinc-500 max-w-md leading-relaxed">{item.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                  isAllowed ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                )}>
                  {isAllowed ? <Check size={12} /> : <X size={12} />}
                  {isAllowed ? 'Access Granted' : 'Access Denied'}
                </div>
                
                <button
                  onClick={() => togglePermission(item.key)}
                  disabled={saving}
                  className={cn(
                    "w-14 h-8 rounded-full relative transition-all duration-500",
                    isAllowed ? "bg-zinc-900" : "bg-zinc-200"
                  )}
                >
                  <motion.div
                    animate={{ x: isAllowed ? 24 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-lg">Neural Privacy Protocol</h4>
            <p className="text-xs text-zinc-400">Changes to access permissions take effect immediately across all neural nodes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          <AlertCircle size={14} />
          End-to-End Encrypted
        </div>
      </div>
    </div>
  );
};
