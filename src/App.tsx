import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  LayoutDashboard, 
  Sparkles, 
  Trash2, 
  BarChart3, 
  Settings, 
  Search, 
  Bell,
  ShieldCheck,
  Lock,
  Zap,
  Brain,
  Database,
  Terminal,
  Activity
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { AIAnalysis } from './components/AIAnalysis';
import { CleanupView } from './components/CleanupView';
import { WellnessView } from './components/WellnessView';
import { DataSourcesView } from './components/DataSourcesView';
import { BackupView } from './components/BackupView';
import { PermissionsView } from './components/PermissionsView';
import { Auth } from './components/Auth';
import { AccessControlView } from './components/AccessControlView';
import { mockDashboardData } from './mockData';
import { cn } from './lib/utils';
import { apiFetch } from './lib/api';

export default function App() {
  const [user, setUser] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [data, setData] = React.useState(mockDashboardData);
  const [wsStatus, setWsStatus] = React.useState('Connecting...');
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [needsAccessControl, setNeedsAccessControl] = React.useState(false);
  const [theme, setTheme] = React.useState('light');
  const [scanProgress, setScanProgress] = React.useState<{ active: boolean; percent: number; currentFile: string }>({
    active: false,
    percent: 0,
    currentFile: ''
  });

  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchPreferences(parsedUser.id);
    } else {
      handleLogout();
    }
    setIsInitialLoading(false);
  }, []);

  const fetchPreferences = async (userId: number) => {
    try {
      const prefs = await apiFetch<any>(`/api/preferences/${userId}`);
      if (prefs.theme) setTheme(prefs.theme);
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  React.useEffect(() => {
    document.body.className = theme === 'light' ? '' : `theme-${theme}`;
  }, [theme]);

  const updateTheme = async (newTheme: string) => {
    setTheme(newTheme);
    if (user) {
      try {
        await apiFetch('/api/preferences', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id, theme: newTheme }),
        });
      } catch (err) {
        console.error('Failed to save theme:', err);
      }
    }
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const result = await apiFetch<any>(`/api/dashboard/${user.id}`);
      if (result) {
        // Map backend data to DashboardData structure
        const totalStorage = 512 * 1024 * 1024 * 1024; // 512GB
        const usedStorage = result.files.reduce((acc: number, f: any) => acc + f.size, 0);
        
        // Simple wellness score calculation
        const wellnessScore = Math.max(0, Math.min(100, 100 - (usedStorage / totalStorage * 100)));

        setData(prev => ({
          ...prev,
          usedStorage,
          wellnessScore: Math.round(wellnessScore),
          cleanupGoal: result.cleanupGoal,
          items: result.recommendations.map((r: any) => ({
            id: r.id,
            name: r.name,
            size: r.size,
            type: r.file_type || 'document',
            category: r.file_type || 'Other',
            isDuplicate: false,
            confidenceScore: r.confidence_score,
            riskLevel: r.risk_level,
            path: r.path
          }))
        }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  React.useEffect(() => {
    if (!user) return;

    // Periodic session check or handle 401 via global events
    const handleUnauthorized = (event: PromiseRejectionEvent) => {
      if (event.reason?.message === 'Session expired') {
        handleLogout();
      }
    };

    window.addEventListener('unhandledrejection', handleUnauthorized);
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onopen = () => setWsStatus('Neural Link Active');
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'SCAN_STARTED') {
        setScanProgress({ active: true, percent: 0, currentFile: 'Initializing...' });
      } else if (msg.type === 'SCAN_PROGRESS') {
        setScanProgress({ active: true, percent: msg.progress, currentFile: msg.currentFile });
        fetchDashboardData(); // Update UI as we find files
      } else if (msg.type === 'SCAN_COMPLETE') {
        console.log('Scan complete from agent:', msg.count);
        setScanProgress({ active: false, percent: 100, currentFile: 'Complete' });
        fetchDashboardData();
      }
    };
    socket.onclose = () => setWsStatus('Neural Link Offline');

    fetchDashboardData();

    return () => socket.close();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateCleanupGoal = async (goalGB: number) => {
    if (!user) return;
    const goalBytes = goalGB * 1024 * 1024 * 1024;
    try {
      await apiFetch('/api/preferences', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, cleanupGoal: goalBytes }),
      });
      setData(prev => ({ ...prev, cleanupGoal: goalBytes }));
    } catch (err) {
      console.error('Failed to save cleanup goal:', err);
    }
  };

  const handleScan = async () => {
    if (!user) return;
    try {
      await apiFetch('/api/scan', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (err) {
      console.error('Scan failed:', err);
    }
  };

  const handleCleanup = async (itemIds: string[]) => {
    if (!user) return;
    try {
      await apiFetch('/api/cleanup', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, itemIds }),
      });
      await fetchDashboardData();
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
  };

  const handleAnalyze = async () => {
    if (!user) return;
    try {
      const result = await apiFetch<any>('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });
      return result.analysis;
    } catch (err) {
      console.error('Analysis failed:', err);
      return null;
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={24} className="text-zinc-900 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold font-serif italic tracking-tight">DataDetox</h2>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={(u) => {
      setUser(u);
      setNeedsAccessControl(true);
      fetchPreferences(u.id);
    }} />;
  }

  if (needsAccessControl) {
    return <AccessControlView userId={user.id} onComplete={() => {
      setNeedsAccessControl(false);
      handleScan(); // Start detox process immediately after granting access
    }} />;
  }

    const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard data={data} onScan={handleScan} onTabChange={setActiveTab} scanProgress={scanProgress} onUpdateGoal={updateCleanupGoal} />;
      case 'analysis': return <AIAnalysis data={data} onAnalyze={handleAnalyze} />;
      case 'cleanup': return <CleanupView items={data.items} onCleanup={handleCleanup} />;
      case 'wellness': return <WellnessView metrics={data.metrics} />;
      case 'sources': return <DataSourcesView onRefresh={fetchDashboardData} />;
      case 'backup': return <BackupView />;
      case 'permissions': return <PermissionsView />;
      default: return <Dashboard data={data} onScan={handleScan} onTabChange={setActiveTab} scanProgress={scanProgress} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] overflow-hidden selection:bg-zinc-900 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200/60 flex flex-col z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-brand-200">
            <Wind size={20} />
          </div>
          <span className="font-bold text-xl tracking-tighter text-brand-700">DataDetox</span>
        </div>

        <div className="px-6 mb-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Deep search..." 
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold tracking-tight placeholder:text-zinc-300 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'analysis', label: 'AI Intelligence', icon: Sparkles },
            { id: 'cleanup', label: 'Cleanup Center', icon: Trash2 },
            { id: 'sources', label: 'Data Sources', icon: Database },
            { id: 'backup', label: 'Backup Space', icon: ShieldCheck },
            { id: 'permissions', label: 'Access Control', icon: Lock },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                activeTab === item.id 
                  ? "bg-brand-500 text-white shadow-2xl shadow-brand-200" 
                  : "text-muted hover:bg-brand-50 hover:text-brand-600"
              )}
            >
              <item.icon size={18} className={cn(
                "transition-transform duration-300 group-hover:scale-110",
                activeTab === item.id ? "text-white" : "text-zinc-300 group-hover:text-zinc-900"
              )} />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-zinc-100 space-y-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", wsStatus.includes('Active') ? "bg-emerald-500" : "bg-amber-500")} />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{wsStatus}</span>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all group">
            <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
            <span className="text-sm font-bold">Settings</span>
          </button>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between px-2">
            {[
              { id: 'light', color: 'bg-white border-zinc-200' },
              { id: 'dark', color: 'bg-zinc-900 border-zinc-800' },
              { id: 'ethereal', color: 'bg-blue-500 border-blue-400' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => updateTheme(t.id)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  t.color,
                  theme === t.id ? "scale-125 shadow-lg" : "opacity-50 hover:opacity-100"
                )}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-24 bg-transparent px-12 flex items-center justify-between shrink-0">
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search intelligence, files, or behavioral patterns..." 
                className="w-full bg-white border border-zinc-200/60 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-300 transition-all outline-none shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm">
              <Activity size={16} className="text-zinc-900" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">System Load</p>
                <p className="text-xs font-bold text-zinc-900 mt-1">12% CPU • 4.2GB RAM</p>
              </div>
            </div>
            <button className="p-3 text-zinc-400 hover:bg-white hover:text-zinc-900 rounded-2xl transition-all relative glass-card border-none shadow-none hover:shadow-md">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-zinc-900 rounded-full border-2 border-[#F5F5F7]" />
            </button>
            <div className="h-10 w-px bg-zinc-200" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 p-1.5 pr-4 hover:bg-white rounded-2xl transition-all glass-card border-none shadow-none hover:shadow-md group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-brand-200 group-hover:bg-red-500 transition-colors">
                {user.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-zinc-900 leading-none">{user.username}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Neural Tier • Logout</p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
