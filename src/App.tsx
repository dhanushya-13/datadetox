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
  Activity,
  Lightbulb
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
import { RecommendationsView } from './components/RecommendationsView';
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
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([
    { id: 1, title: 'Neural Scan Complete', time: '2m ago', icon: <Zap size={14} />, type: 'scan', read: false },
    { id: 2, title: 'Security Alert: New Device', time: '1h ago', icon: <ShieldCheck size={14} />, type: 'security', read: false },
    { id: 3, title: 'Storage Optimization Ready', time: '3h ago', icon: <Activity size={14} />, type: 'cleanup', read: false },
  ]);
  const [scanProgress, setScanProgress] = React.useState<{ active: boolean; percent: number; currentFile: string }>({
    active: false,
    percent: 0,
    currentFile: ''
  });

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase().trim();
    
    const scoredItems = data.items.map(item => {
      let score = 0;
      const name = item.name.toLowerCase();
      const type = item.type.toLowerCase();
      const reason = (item.reason || '').toLowerCase();

      // Exact match on name gets highest priority
      if (name === query) score += 100;
      // Starts with query
      else if (name.startsWith(query)) score += 50;
      // Contains query in name
      else if (name.includes(query)) score += 30;

      // Match in type
      if (type.includes(query)) score += 15;
      // Match in reason
      if (reason.includes(query)) score += 10;

      return { item, score };
    });

    return {
      ...data,
      items: scoredItems
        .filter(si => si.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(si => si.item)
    };
  }, [data, searchQuery]);

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
      const [result, trends] = await Promise.all([
        apiFetch<any>(`/api/dashboard/${user.id}`),
        apiFetch<any[]>(`/api/trends/${user.id}`)
      ]);

      if (result) {
        // Map backend data to DashboardData structure
        const totalStorage = 500 * 1024 * 1024 * 1024; // 500GB
        const usedStorage = (result.files.reduce((acc: number, f: any) => acc + f.size, 0)) + (result.storageOffset || 0);
        const wellnessScore = result.wellnessScore || 50;

        setData(prev => ({
          ...prev,
          usedStorage,
          wellnessScore,
          cleanupGoal: result.cleanupGoal,
          trends: trends || [],
          forecast: result.forecast || prev.forecast,
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
        
        // Add a new notification
        setNotifications(prev => [
          { 
            id: Date.now(), 
            title: `Neural Scan Complete: ${msg.count} files analyzed`, 
            time: 'Just now', 
            icon: <Zap size={14} />, 
            type: 'scan',
            read: false 
          },
          ...prev
        ]);
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
      const stats = await apiFetch<any>('/api/analyze/stats', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      });

      if (!stats) {
        throw new Error('Failed to retrieve analysis statistics.');
      }

      const prompt = `
        As a Digital Detox Specialist, analyze this user's storage profile:
        - Total Files: ${stats.totalFiles}
        - Total Storage: ${(stats.totalSize / (1024**3)).toFixed(2)} GB
        - Flagged for Cleanup: ${stats.flaggedCount} items (${(stats.flaggedSize / (1024**2)).toFixed(2)} MB)
        
        Provide a concise, professional report in Markdown. 
        Include:
        1. A "Neural Balance" assessment.
        2. Specific observations about their storage habits.
        3. A 3-step action plan for their "Digital Detox".
        Use a sophisticated, slightly futuristic tone.
      `;

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ parts: [{ text: prompt }] }],
      });

      return response.text;
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
      case 'dashboard': return <Dashboard data={filteredData} onScan={handleScan} onTabChange={setActiveTab} scanProgress={scanProgress} onUpdateGoal={updateCleanupGoal} />;
      case 'analysis': return <AIAnalysis data={filteredData} onAnalyze={handleAnalyze} onDetox={handleCleanup} />;
      case 'recommendations': return <RecommendationsView data={filteredData} />;
      case 'cleanup': return <CleanupView items={filteredData.items} onCleanup={handleCleanup} onTabChange={setActiveTab} />;
      case 'wellness': return <WellnessView metrics={filteredData.metrics} />;
      case 'sources': return <DataSourcesView user={user} onRefresh={fetchDashboardData} />;
      case 'backup': return <BackupView onRefresh={fetchDashboardData} />;
      case 'permissions': return <PermissionsView />;
      case 'settings': return (
        <div className="space-y-8 pb-20 overflow-y-auto max-h-full custom-scrollbar">
          <header className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 font-serif italic">System Settings</h1>
            <p className="text-zinc-400 font-medium text-sm tracking-wide uppercase">Configure your neural experience</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card rounded-[2rem] p-8 space-y-6">
              <h3 className="font-bold text-lg">Appearance</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme Mode</span>
                <div className="flex gap-2">
                  {['light', 'dark', 'ethereal'].map(t => (
                    <button
                      key={t}
                      onClick={() => updateTheme(t)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        theme === t ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="glass-card rounded-[2rem] p-8 space-y-6">
              <h3 className="font-bold text-lg">Notifications</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Neural Alerts</span>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      default: return <Dashboard data={filteredData} onScan={handleScan} onTabChange={setActiveTab} scanProgress={scanProgress} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F5F7] overflow-hidden selection:bg-zinc-900 selection:text-white relative">
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 bg-white/80 backdrop-blur-md px-6 lg:px-12 flex items-center justify-between shrink-0 gap-4 border-b border-zinc-200/60 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-xl shadow-brand-200">
              <Wind size={20} />
            </div>
            <span className="font-bold text-xl tracking-tighter text-brand-700 hidden sm:block">DataDetox</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-1 bg-zinc-100/50 p-1 rounded-2xl border border-zinc-200/60">
            {[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { id: 'analysis', label: 'AI Intelligence', icon: Sparkles },
              { id: 'recommendations', label: 'Neural Tips', icon: Lightbulb },
              { id: 'cleanup', label: 'Cleanup Center', icon: Trash2 },
              { id: 'sources', label: 'Data Sources', icon: Database },
              { id: 'backup', label: 'Backup Space', icon: ShieldCheck },
              { id: 'permissions', label: 'Access Control', icon: Lock },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold tracking-tight",
                  activeTab === item.id 
                    ? "bg-white text-brand-600 shadow-sm border border-zinc-200/60" 
                    : "text-zinc-400 hover:text-zinc-900 hover:bg-white/50"
                )}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-3 text-zinc-400 hover:bg-white hover:text-zinc-900 rounded-2xl transition-all relative glass-card border-none shadow-none hover:shadow-md"
              >
                <Bell size={20} />
                <span className="absolute top-3 right-3 w-2 h-2 bg-zinc-900 rounded-full border-2 border-[#F5F5F7]" />
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 glass-card rounded-3xl p-6 bg-white z-[100] shadow-2xl border-none"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold uppercase tracking-widest">Notifications</h4>
                      <button 
                        onClick={() => setNotifications([])}
                        className="text-[10px] font-bold text-brand-500 uppercase tracking-widest hover:text-brand-700 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              if (n.type === 'cleanup') setActiveTab('cleanup');
                              if (n.type === 'scan') setActiveTab('analysis');
                              if (n.type === 'security') setActiveTab('permissions');
                              setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
                              setShowNotifications(false);
                            }}
                            className={cn(
                              "flex items-start gap-4 p-3 rounded-2xl transition-colors cursor-pointer group relative",
                              n.read ? "bg-transparent hover:bg-zinc-50" : "bg-brand-50/50 hover:bg-brand-50"
                            )}
                          >
                            {!n.read && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-brand-500 rounded-full" />}
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                              n.read ? "bg-zinc-100 text-zinc-400" : "bg-brand-500 text-white"
                            )}>
                              {n.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs truncate", n.read ? "text-zinc-500 font-medium" : "text-zinc-900 font-bold")}>
                                {n.title}
                              </p>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{n.time}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center space-y-2">
                          <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                            <Bell size={20} />
                          </div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

        <div className="flex-1 overflow-y-auto px-6 lg:px-12 pb-12 custom-scrollbar">
          {/* Mobile Navigation */}
          <div className="lg:hidden py-6 flex overflow-x-auto gap-2 no-scrollbar">
            {[
              { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
              { id: 'analysis', label: 'AI Intelligence', icon: Sparkles },
              { id: 'recommendations', label: 'Neural Tips', icon: Lightbulb },
              { id: 'cleanup', label: 'Cleanup Center', icon: Trash2 },
              { id: 'sources', label: 'Data Sources', icon: Database },
              { id: 'backup', label: 'Backup Space', icon: ShieldCheck },
              { id: 'permissions', label: 'Access Control', icon: Lock },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all text-xs font-bold tracking-tight whitespace-nowrap",
                  activeTab === item.id 
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-200" 
                    : "bg-white text-zinc-400 border border-zinc-200/60"
                )}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

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
