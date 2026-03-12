import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import { 
  HardDrive, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  Video,
  Box,
  Calendar,
  ShieldAlert,
  Zap,
  ChevronRight,
  Download,
  Sparkles,
  Lightbulb,
  Trash2,
  Database
} from 'lucide-react';
import { DashboardData } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface DashboardProps {
  data: DashboardData;
  onScan: () => Promise<void>;
  onTabChange: (tab: string) => void;
  scanProgress: { active: boolean; percent: number; currentFile: string };
  onUpdateGoal?: (goalGB: number) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onScan, onTabChange, scanProgress, onUpdateGoal }) => {
  const [isEditingGoal, setIsEditingGoal] = React.useState(false);
  const [newGoal, setNewGoal] = React.useState('');

  const { usedGB, totalGB, freeGB, goalGB } = React.useMemo(() => ({
    usedGB: (data.usedStorage / (1024 ** 3)).toFixed(1),
    totalGB: (data.totalStorage / (1024 ** 3)).toFixed(0),
    freeGB: ((data.totalStorage - data.usedStorage) / (1024 ** 3)).toFixed(1),
    goalGB: data.cleanupGoal ? (data.cleanupGoal / (1024 ** 3)).toFixed(1) : null
  }), [data.usedStorage, data.totalStorage, data.cleanupGoal]);

  const handleScanClick = async () => {
    await onScan();
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newGoal);
    if (!isNaN(val) && onUpdateGoal) {
      await onUpdateGoal(val);
      setIsEditingGoal(false);
    }
  };

  const forecastData = React.useMemo(() => data.forecast.map(p => ({
    ...p,
    displayDate: format(new Date(p.date), 'MMM'),
    goal: data.cleanupGoal ? data.cleanupGoal / (1024 ** 3) : null,
    predictedSizeGB: p.predictedSize / (1024 ** 3)
  })), [data.forecast, data.cleanupGoal]);

  const trendData = React.useMemo(() => data.trends.map(p => ({
    ...p,
    displayDate: format(new Date(p.timestamp), 'MM/dd'),
    sizeGB: p.size / (1024 ** 3)
  })), [data.trends]);

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-zinc-900 font-serif italic">Digital Intelligence</h1>
          <p className="text-zinc-400 font-medium text-xs sm:text-sm tracking-wide uppercase">System Status: Optimal • Last Scan: 2m ago</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-brand-50 flex items-center justify-center text-[10px] font-bold text-brand-400 overflow-hidden">
                <img src={`https://picsum.photos/seed/${i + 20}/40/40`} alt="User" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <button 
            onClick={handleScanClick}
            disabled={scanProgress.active}
            className="px-8 py-3 bg-brand-500 text-white rounded-2xl text-xs font-bold tracking-widest uppercase hover:bg-brand-600 transition-all shadow-xl shadow-brand-200 disabled:opacity-50 flex items-center gap-2"
          >
            {scanProgress.active ? (
              <>
                <Zap size={14} className="animate-pulse" />
                Scanning...
              </>
            ) : (
              'Run Deep Scan'
            )}
          </button>
        </div>
      </header>

      {/* Quick Access Modules */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { id: 'analysis', label: 'AI Intelligence', icon: Sparkles, color: 'bg-indigo-50 text-indigo-600', desc: 'Neural reports' },
          { id: 'recommendations', label: 'Neural Tips', icon: Lightbulb, color: 'bg-amber-50 text-amber-600', desc: 'AI suggestions' },
          { id: 'cleanup', label: 'Cleanup Center', icon: Trash2, color: 'bg-rose-50 text-rose-600', desc: 'Prune storage' },
          { id: 'sources', label: 'Data Sources', icon: Database, color: 'bg-emerald-50 text-emerald-600', desc: 'Cloud & local' },
          { id: 'backup', label: 'Backup Space', icon: Box, color: 'bg-blue-50 text-blue-600', desc: 'Neural snapshots' },
          { id: 'permissions', label: 'Access Control', icon: ShieldAlert, color: 'bg-zinc-900 text-white', desc: 'Security' },
        ].map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(item.id)}
            className="p-6 bg-white rounded-[2rem] border border-zinc-100 hover:border-brand-200 hover:shadow-xl hover:shadow-zinc-200/50 transition-all text-left flex flex-col gap-4 group"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-3", item.color)}>
              <item.icon size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-900 tracking-tight">{item.label}</h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{item.desc}</p>
            </div>
          </motion.button>
        ))}
      </section>

      {scanProgress.active && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 bg-brand-500 text-white border-none shadow-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="animate-spin text-brand-200" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest">Neural Scan in Progress</h4>
                <p className="text-[10px] text-brand-100 font-medium truncate max-w-[300px]">
                  Analyzing: {scanProgress.currentFile}
                </p>
              </div>
            </div>
            <span className="text-xl font-bold italic font-serif">{Math.round(scanProgress.percent)}%</span>
          </div>
          <div className="h-1.5 w-full bg-brand-600 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${scanProgress.percent}%` }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Storage Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 glass-card rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 flex flex-col justify-between min-h-[350px] sm:min-h-[400px]"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">Main Partition</span>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-700">System Storage</h3>
            </div>
            <div className="p-3 sm:p-4 bg-brand-50 rounded-2xl border border-brand-100">
              <HardDrive size={18} className="text-brand-500" />
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8 my-6 sm:my-0">
            <div className="flex items-baseline gap-2 sm:gap-4">
              <span className="text-6xl sm:text-8xl font-black tracking-tighter leading-none text-zinc-900 drop-shadow-sm">{usedGB}</span>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-zinc-900">GB</span>
                <span className="text-[10px] sm:text-xs font-black text-red-500 uppercase tracking-widest -mt-1">Consumed</span>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div className="h-1.5 w-full bg-brand-50 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.usedStorage / data.totalStorage) * 100}%` }}
                  className="h-full bg-brand-500 rounded-full"
                />
              </div>
              <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                <span>0 GB</span>
                <span>{totalGB} GB CAPACITY</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-brand-100">
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Available</p>
              <p className="text-lg sm:text-xl font-bold text-brand-700">{freeGB} GB</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Growth</p>
              <p className="text-lg sm:text-xl font-bold text-accent-500">+2.4%</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Efficiency</p>
              <p className="text-lg sm:text-xl font-bold text-brand-700">94.2%</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Disk Full In</p>
              <p className="text-lg sm:text-xl font-bold text-red-500">42 Days</p>
            </div>
          </div>
        </motion.div>

        {/* Wellness Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-4 glass-card rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-brand-500 text-white border-none shadow-2xl shadow-brand-200"
        >
          <div className="relative w-32 h-32 sm:w-48 sm:h-48 mb-6 sm:mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="50%" cy="50%" r="40%" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="transparent" />
              <motion.circle
                cx="50%"
                cy="50%"
                r="40%"
                stroke="white"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * data.wellnessScore) / 100 }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl sm:text-6xl font-bold tracking-tighter leading-none text-zinc-900">{data.wellnessScore}</span>
              <span className="text-[8px] sm:text-[10px] font-bold text-zinc-900/60 uppercase tracking-[0.2em] mt-1 sm:mt-2">Score</span>
            </div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Digital Wellness</h3>
          <p className="text-xs sm:text-sm text-black font-bold leading-relaxed mb-6 sm:mb-8 px-2 sm:px-4">Your digital environment is refined but has room for optimization.</p>
          <button 
            onClick={() => onTabChange('cleanup')}
            className="w-full py-3 sm:py-4 bg-amber-400 text-zinc-900 rounded-2xl font-bold text-[10px] sm:text-xs tracking-widest uppercase hover:bg-amber-300 transition-all shadow-xl shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            Optimize Now
          </button>
        </motion.div>

        {/* Historical Trends Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="md:col-span-12 glass-card rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">Historical Analysis</span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">Storage Velocity</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-full border border-brand-100 self-start sm:self-auto">
              <TrendingUp size={14} className="text-brand-500" />
              <span className="text-[10px] font-bold text-brand-600 uppercase">Last 14 Days</span>
            </div>
          </div>

          <div className="h-48 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'var(--muted)', fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'var(--muted)', fontWeight: 700 }}
                  unit="GB"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)', 
                    padding: '16px',
                    backgroundColor: 'var(--card)',
                    color: 'var(--text)'
                  }}
                  labelStyle={{ fontWeight: 800, fontSize: '12px', marginBottom: '4px', color: 'var(--text)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sizeGB" 
                  stroke="var(--accent)" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--card)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Used Storage"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Forecast Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-7 glass-card rounded-[2.5rem] p-10"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">Predictive Model v2.4</span>
              <h3 className="text-xl font-bold tracking-tight">Storage Forecast</h3>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-full border border-brand-100">
              <Calendar size={14} className="text-brand-500" />
              <span className="text-[10px] font-bold text-brand-600 uppercase">Next 12 Months</span>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Predicted</span>
              </div>
              {data.cleanupGoal && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-500" />
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Goal ({goalGB} GB)</span>
                </div>
              )}
            </div>
            
            {isEditingGoal ? (
              <form onSubmit={handleGoalSubmit} className="flex items-center gap-2">
                <input 
                  type="number"
                  step="0.1"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Goal (GB)"
                  className="w-24 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-lg text-xs font-bold outline-none focus:border-brand-500 transition-all"
                  autoFocus
                />
                <button type="submit" className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">Set</button>
                <button type="button" onClick={() => setIsEditingGoal(false)} className="text-[10px] font-bold text-muted uppercase tracking-widest">Cancel</button>
              </form>
            ) : (
              <button 
                onClick={() => {
                  setNewGoal(goalGB || '');
                  setIsEditingGoal(true);
                }}
                className="text-[10px] font-bold text-muted uppercase tracking-widest hover:text-brand-600 transition-colors flex items-center gap-1"
              >
                <TrendingDown size={12} />
                {data.cleanupGoal ? 'Adjust Goal' : 'Set Cleanup Goal'}
              </button>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: 'var(--muted)', fontWeight: 700 }} 
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fill: 'var(--muted)', fontWeight: 700 }}
                  unit="GB"
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)', 
                    padding: '16px',
                    backgroundColor: 'var(--card)',
                    color: 'var(--text)'
                  }}
                  labelStyle={{ fontWeight: 800, fontSize: '12px', marginBottom: '4px', color: 'var(--text)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="predictedSizeGB" 
                  stroke="var(--accent)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#forecastGradient)" 
                  name="Predicted"
                />
                {data.cleanupGoal && (
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="var(--accent)" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Goal"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-5 glass-card rounded-[2.5rem] p-10 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em]">Risk Assessment</span>
              <h3 className="text-xl font-bold tracking-tight">AI Flagged Items</h3>
            </div>
            <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center text-accent-600 border border-accent-100">
              <ShieldAlert size={20} />
            </div>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {data.items.map((item, idx) => (
              <div 
                key={item.id}
                className="p-4 bg-brand-50/30 rounded-2xl border border-brand-100 hover:border-brand-300 transition-all group flex items-center gap-4 cursor-pointer"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  item.riskLevel === 'high' ? "bg-red-50 text-red-500" : "bg-white text-brand-400 group-hover:text-brand-600"
                )}>
                  {item.type === 'app' ? <Box size={18} /> : <FileText size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-brand-700">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-brand-400 uppercase tracking-wider">{item.confidenceScore}% Match</span>
                    <div className="w-1 h-1 rounded-full bg-brand-200" />
                    <span className={cn(
                       "text-[9px] font-bold uppercase tracking-wider",
                       item.riskLevel === 'high' ? "text-red-500" : "text-accent-500"
                    )}>{item.riskLevel} Risk</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors opacity-0 group-hover:opacity-100">
                    <Download size={14} />
                  </button>
                  <ChevronRight size={14} className="text-brand-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Neural Insights Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="md:col-span-12 glass-card rounded-[2.5rem] p-10 bg-zinc-900 text-white border-none overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <Sparkles size={200} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Neural Insights Summary</h3>
              </div>
              <p className="text-lg text-zinc-400 font-serif italic leading-relaxed">
                "We've detected a significant accumulation of redundant media in your 'Archives' sector. Optimizing these clusters could improve system responsiveness by 14%."
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Efficiency: 68%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Entropy: Rising</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => onTabChange('analysis')}
              className="px-8 py-4 bg-white text-zinc-900 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-brand-500 hover:text-white transition-all shadow-xl shadow-white/10"
            >
              View Full Intelligence Report
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
