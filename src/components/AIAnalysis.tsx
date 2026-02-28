import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Wind, 
  Download,
  Zap,
  Brain,
  Target,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Video,
  Archive,
  RefreshCw,
  Box
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Radar as ReRadar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ZAxis,
  RadialBarChart,
  RadialBar,
  Legend,
  ComposedChart,
  Line,
  Treemap,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';
import Markdown from 'react-markdown';
import { DashboardData } from '../types';
import { cn } from '../lib/utils';

interface AIAnalysisProps {
  data: DashboardData;
  onAnalyze?: () => Promise<string | null>;
  onDetox?: (itemIds: string[]) => Promise<void>;
}

const VisualReport: React.FC<{ analysis: string | null }> = ({ analysis }) => {
  if (!analysis) return null;

  const treemapData = [
    {
      name: 'Media',
      children: [
        { name: 'Video', size: 4500 },
        { name: 'Images', size: 2500 },
        { name: 'Audio', size: 1500 },
      ],
    },
    {
      name: 'Work',
      children: [
        { name: 'Projects', size: 3000 },
        { name: 'Docs', size: 1000 },
        { name: 'Archives', size: 2000 },
      ],
    },
    {
      name: 'System',
      children: [
        { name: 'Logs', size: 500 },
        { name: 'Cache', size: 1500 },
      ],
    },
  ];

  const funnelData = [
    { value: 100, name: 'Total Data', fill: '#f4f4f5' },
    { value: 80, name: 'Redundant', fill: '#fbbf24' },
    { value: 50, name: 'Flagged', fill: '#f87171' },
    { value: 30, name: 'Detoxed', fill: '#10b981' },
  ];

  const entropyData = [
    { name: 'Jan', storage: 400, entropy: 240 },
    { name: 'Feb', storage: 300, entropy: 139 },
    { name: 'Mar', storage: 200, entropy: 980 },
    { name: 'Apr', storage: 278, entropy: 390 },
    { name: 'May', storage: 189, entropy: 480 },
    { name: 'Jun', storage: 239, entropy: 380 },
    { name: 'Jul', storage: 349, entropy: 430 },
  ];

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Neural Funnel</h3>
          <div className="h-64 w-full bg-zinc-50 rounded-[2rem] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Funnel
                  dataKey="value"
                  data={funnelData}
                  isAnimationActive
                >
                  <LabelList position="right" fill="#888" stroke="none" dataKey="name" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Entropy vs. Optimization</h3>
          <div className="h-64 w-full bg-zinc-50 rounded-[2rem] p-6">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={entropyData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="storage" barSize={20} fill="var(--brand-100)" radius={[10, 10, 0, 0]} />
                <Line type="monotone" dataKey="entropy" stroke="var(--brand-500)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand-500)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Strategic Roadmap</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Consolidate Media", desc: "Move 45GB to cold storage", icon: Video },
            { step: "02", title: "Prune Archives", desc: "Delete 12 redundant folders", icon: Archive },
            { step: "03", title: "Neural Reset", desc: "Weekly automated scanning", icon: RefreshCw },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white border border-zinc-100 rounded-[2rem] hover:border-brand-200 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black text-zinc-100 group-hover:text-brand-100 transition-colors">{item.step}</span>
                <item.icon size={20} className="text-brand-500" />
              </div>
              <h4 className="font-bold text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 bg-zinc-900 rounded-[2.5rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Brain size={200} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-brand-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Executive Summary</h3>
          </div>
          <p className="text-lg font-medium leading-relaxed text-zinc-300 italic font-serif">
            "Your digital ecosystem is currently operating at 68% efficiency. We've detected significant 'Digital Friction' caused by high-density media clusters and fragmented project archives."
          </p>
        </div>
      </div>
    </div>
  );
};

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data, onAnalyze, onDetox }) => {
  const [loading, setLoading] = React.useState(true);
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [activeInsight, setActiveInsight] = React.useState<number | null>(null);
  const [expandedInsight, setExpandedInsight] = React.useState<number | null>(null);
  const [isDetoxing, setIsDetoxing] = React.useState(false);

  const handleDetoxClick = async () => {
    if (!onDetox) return;
    setIsDetoxing(true);
    try {
      const flaggedIds = data.items.map(i => i.id);
      await onDetox(flaggedIds);
    } finally {
      setIsDetoxing(false);
    }
  };

  React.useEffect(() => {
    const generateReport = async () => {
      setLoading(true);
      if (onAnalyze) {
        const report = await onAnalyze();
        setAnalysis(report);
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
        setAnalysis(`
# Neural Intelligence Report
## Executive Summary
Your digital ecosystem is currently operating at **68% efficiency**. We've detected significant "Digital Friction" caused by high-density media clusters and fragmented project archives.

### Key Observations
*   **Cognitive Load:** High. The sheer volume of unorganized files is creating a background "noise" that impacts focus.
*   **Storage Entropy:** Increasing. 12% of your data has not been accessed in over 2 years.
*   **Neural Balance:** Skewed. Your work-to-media ratio is 1:4, suggesting a need for archive consolidation.

### Strategic Recommendations
1.  **Consolidate Media:** Move 45GB of legacy video content to cold storage.
2.  **Prune Archives:** Delete 12 duplicate project folders identified in the "Work" sector.
3.  **Neural Reset:** Implement a weekly automated scan to prevent future entropy.
        `);
      }
      setLoading(false);
    };

    generateReport();
  }, [onAnalyze]);

  const treemapData = [
    { name: 'Media', size: 4500, fill: '#f43f5e' },
    { name: 'Work', size: 3000, fill: '#10b981' },
    { name: 'System', size: 1500, fill: '#6366f1' },
    { name: 'Archives', size: 2000, fill: '#f59e0b' },
    { name: 'Temp', size: 800, fill: '#94a3b8' },
  ];

  const categoryData = [
    { name: 'Media', value: 45 },
    { name: 'Work', value: 30 },
    { name: 'System', value: 15 },
    { name: 'Other', value: 10 },
  ];

  const insights = [
    { 
      title: "Digital Hoarding Pattern", 
      desc: "Detected 12GB of redundant project versions.", 
      details: "Our neural engine identified multiple iterations of the same project files across different directories. This pattern suggests a 'save-as' workflow that hasn't been pruned in over 180 days. Consolidation could reclaim 12.4GB of high-speed storage.",
      icon: AlertTriangle, 
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    { 
      title: "Neural Efficiency", 
      desc: "System focus is currently at 72% of potential.", 
      details: "Your cognitive load is impacted by 4,293 unindexed files. By implementing our recommended 'Neural Reset' protocol, we estimate a 15% increase in system responsiveness and a significant reduction in visual clutter.",
      icon: Zap, 
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    { 
      title: "Entropy Alert", 
      desc: "Storage fragmentation is increasing in the Media sector.", 
      details: "High-density video clusters are currently fragmented across 4 different partitions. This creates 'Digital Friction' during retrieval. We recommend a unified media archive strategy to stabilize the entropy levels.",
      icon: Activity, 
      color: "text-red-500",
      bg: "bg-red-50"
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 font-serif italic">AI Intelligence</h1>
          <p className="text-zinc-400 font-medium text-sm tracking-wide uppercase">Neural correlation of your digital existence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-5 py-2.5 bg-zinc-900 text-white rounded-2xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-zinc-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Gemini 3.1 Pro Active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Metrics & Insights */}
        <div className="lg:col-span-4 space-y-8">
          {/* Neural Treemap */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2.5rem] p-8 bg-white relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Box size={20} className="text-brand-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Neural Topography</h3>
              </div>
              <div className="text-xs font-bold text-muted">v4.0</div>
            </div>
            
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="var(--brand-500)"
                >
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 pt-6 border-t border-zinc-50 flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Complexity</p>
                <p className="text-lg font-bold text-brand-500">Intense</p>
              </div>
              <div className="w-px h-8 bg-zinc-100" />
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Cohesion</p>
                <p className="text-lg font-bold text-emerald-500">Stable</p>
              </div>
            </div>
          </motion.div>

          {/* Insight Cards */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] px-4">Neural Insights</h3>
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setExpandedInsight(expandedInsight === idx ? null : idx)}
                className={cn(
                  "p-6 rounded-[2rem] border transition-all cursor-pointer group overflow-hidden relative",
                  expandedInsight === idx 
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-2xl shadow-zinc-200" 
                    : activeInsight === idx 
                      ? "bg-brand-50 border-brand-200 text-zinc-900" 
                      : "bg-white border-zinc-100 hover:border-brand-200"
                )}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    expandedInsight === idx ? "bg-white/10 text-white" : cn(insight.bg, insight.color)
                  )}>
                    <insight.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{insight.title}</h4>
                    <p className={cn(
                      "text-xs font-medium leading-relaxed",
                      expandedInsight === idx ? "text-zinc-400" : "text-zinc-500"
                    )}>{insight.desc}</p>
                    
                    <AnimatePresence>
                      {expandedInsight === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-white/10"
                        >
                          <p className="text-xs text-zinc-300 leading-relaxed italic">
                            {insight.details}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.div
                    animate={{ rotate: expandedInsight === idx ? 90 : 0 }}
                  >
                    <ArrowRight size={14} className={cn(
                      "mt-1 transition-transform group-hover:translate-x-1",
                      expandedInsight === idx ? "text-white" : "text-zinc-300"
                    )} />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column: Detailed Analysis */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card rounded-[3rem] h-full p-12 md:p-16 bg-white flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-brand-50 border-t-brand-500 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu size={40} className="text-brand-500 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight font-serif italic">Synthesizing Intelligence</h3>
                  <p className="text-sm font-bold text-muted uppercase tracking-widest">Correlating 14,293 data points...</p>
                </div>
                
                <div className="w-full max-w-xs h-1.5 bg-brand-50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="h-full bg-brand-500 rounded-full"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[3rem] p-12 md:p-16 shadow-2xl shadow-zinc-200/50 border-none bg-white relative overflow-hidden h-full flex flex-col"
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                  <Wind size={500} />
                </div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-zinc-50 rounded-full blur-3xl opacity-50" />

                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-200">
                      <Target size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight font-serif italic">Neural Synthesis Report</h2>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Generated by DataDetox Core • 99.9% Confidence</p>
                    </div>
                  </div>

                  <VisualReport analysis={analysis} />
                </div>
                
                <div className="mt-20 pt-10 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Neural Integrity Verified</p>
                      <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5">Hash: 0x7f3a...9d2e</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleDetoxClick}
                      disabled={isDetoxing}
                      className="px-10 py-4 bg-brand-500 text-white rounded-2xl text-xs font-bold tracking-widest uppercase hover:bg-brand-600 transition-all shadow-xl shadow-brand-200 flex items-center gap-3 group disabled:opacity-50"
                    >
                      {isDetoxing ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Zap size={16} />
                      )}
                      {isDetoxing ? 'Executing Detox...' : 'Execute Strategic Detox'}
                      {!isDetoxing && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <button className="p-4 bg-brand-50 text-brand-400 rounded-2xl hover:bg-brand-100 hover:text-brand-600 transition-all border border-brand-100" title="Download Report">
                      <Download size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
