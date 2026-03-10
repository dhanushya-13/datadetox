import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Video, 
  Image,
  Folder,
  AppWindow,
  Mail,
  File,
  Archive, 
  AlertTriangle,
  ChevronRight,
  Search,
  ShieldCheck,
  PlayCircle,
  Eye,
  X
} from 'lucide-react';
import { StorageItem } from '../types';
import { cn } from '../lib/utils';

interface CleanupViewProps {
  items: StorageItem[];
  onCleanup: (itemIds: string[]) => Promise<void>;
  onTabChange?: (tab: string) => void;
}

export const CleanupView: React.FC<CleanupViewProps> = ({ items, onCleanup, onTabChange }) => {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'duplicates' | 'large'>('all');
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [isCleaning, setIsCleaning] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [viewingItem, setViewingItem] = React.useState<StorageItem | null>(null);

  const filteredItems = items.filter(item => {
    if (filter === 'duplicates') return item.isDuplicate;
    if (filter === 'large') return item.size > 1024 * 1024 * 100;
    return true;
  });

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCleanupClick = async () => {
    setIsCleaning(true);
    try {
      await onCleanup(selectedItems);
      setSelectedItems([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 8000);
    } finally {
      setIsCleaning(false);
    }
  };

  const totalSelectedSize = items
    .filter(i => selectedItems.includes(i.id))
    .reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 font-serif italic">Cleanup Center</h1>
          <p className="text-zinc-400 font-medium text-sm tracking-wide uppercase">Review and safely remove redundant data</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center gap-2">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Neural Link Active</span>
          </div>
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={cn(
              "flex items-center gap-3 px-6 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all",
              isSimulating 
                ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200" 
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            )}
          >
            <PlayCircle size={16} />
            {isSimulating ? "Simulation Active" : "Simulate Cleanup"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            {['all', 'duplicates', 'large'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  filter === f 
                    ? "bg-zinc-900 text-white" 
                    : "bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:border-zinc-300"
                )}
              >
                {f === 'all' ? 'All Items' : f === 'duplicates' ? 'Duplicates' : 'Large Files'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="popLayout">
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "p-6 rounded-[2rem] border transition-all flex items-center gap-6 group cursor-pointer relative overflow-hidden",
                    selectedItems.includes(item.id) 
                      ? "bg-zinc-50 border-zinc-900/10" 
                      : "bg-white border-zinc-200/60 hover:border-zinc-300"
                  )}
                  onClick={() => toggleItem(item.id)}
                >
                  {isSimulating && selectedItems.includes(item.id) && (
                    <div className="absolute inset-0 bg-zinc-900/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-[0.2em] bg-white/90 px-4 py-2 rounded-full border border-zinc-200 shadow-sm">Simulated Removal</span>
                    </div>
                  )}

                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                    selectedItems.includes(item.id) 
                      ? "bg-zinc-900 border-zinc-900 text-white" 
                      : "border-zinc-200 group-hover:border-zinc-400"
                  )}>
                    {selectedItems.includes(item.id) && <CheckCircle2 size={14} />}
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0 transition-colors text-zinc-900">
                    {(() => {
                      switch (item.type) {
                        case 'image': return <Image size={20} />;
                        case 'video': return <Video size={20} />;
                        case 'document': return <FileText size={20} />;
                        case 'folder': return <Folder size={20} />;
                        case 'app': return <AppWindow size={20} />;
                        case 'email': return <Mail size={20} />;
                        default: return <File size={20} />;
                      }
                    })()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-zinc-900 truncate">{item.name}</h4>
                      {item.isDuplicate && (
                        <span className="bg-zinc-100 text-zinc-500 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Duplicate</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest truncate max-w-[200px]">{item.path}</p>
                      <div className="w-1 h-1 rounded-full bg-zinc-200" />
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={12} className="text-zinc-900" />
                        <span className="text-[10px] font-bold text-zinc-900 uppercase tracking-widest">{item.confidenceScore}% Confidence</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <p className="font-bold text-lg tracking-tight">{(item.size / (1024 * 1024)).toFixed(1)} MB</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Risk: {item.riskLevel}</p>
                    {item.content && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingItem(item);
                        }}
                        className="p-2 bg-zinc-50 text-zinc-400 hover:text-zinc-900 rounded-xl transition-all"
                        title="View Content"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="py-32 text-center space-y-6 glass-card rounded-[3rem] border-dashed">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                <Search size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-zinc-900 font-bold text-xl">No items found</p>
                <p className="text-zinc-400 text-sm">Your digital space is already optimized for this category.</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-10 sticky top-8">
            <h3 className="font-bold text-xl tracking-tight mb-8">Selection Summary</h3>
            
            <div className="space-y-6 mb-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Items Selected</span>
                <span className="text-2xl font-bold tracking-tighter">{selectedItems.length}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Savings</span>
                <span className="text-2xl font-bold tracking-tighter">{(totalSelectedSize / (1024 * 1024)).toFixed(1)} <span className="text-sm text-zinc-300 font-medium">MB</span></span>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 flex gap-4 mb-10">
              <Archive className="text-brand-500 shrink-0" size={20} />
              <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                Cleanup items are automatically archived to your <span className="text-zinc-900 font-bold">Backup Space</span> before removal from active storage.
              </p>
            </div>

            <button 
              onClick={handleCleanupClick}
              disabled={selectedItems.length === 0 || isCleaning}
              className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-200 disabled:opacity-20 disabled:shadow-none flex items-center justify-center gap-3"
            >
              {isCleaning ? (
                <PlayCircle size={18} className="animate-spin" />
              ) : (
                <Trash2 size={18} />
              )}
              {isCleaning ? 'Cleaning...' : 'Cleanup Selected'}
            </button>

            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-emerald-700">
                    <ShieldCheck size={20} />
                    <p className="text-xs font-bold uppercase tracking-widest">Cleanup Successful</p>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium leading-relaxed">
                    Your files have been safely archived. You can view them in the Backup Space.
                  </p>
                  {onTabChange && (
                    <button 
                      onClick={() => onTabChange('backup')}
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      View in Backup Space
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

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
                    {viewingItem.type === 'email' ? <Mail size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl tracking-tight">{viewingItem.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{viewingItem.path}</p>
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
