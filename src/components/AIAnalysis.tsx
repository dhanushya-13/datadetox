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
  Cpu
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
  Tooltip,
  Cell,
  Radar as ReRadar,
  AreaChart,
  Area
} from 'recharts';
import Markdown from 'react-markdown';
import { DashboardData } from '../types';
import { cn } from '../lib/utils';

interface AIAnalysisProps {
  data: DashboardData;
  onAnalyze?: () => Promise<string | null>;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data, onAnalyze }) => {
  const [loading, setLoading] = React.useState(true);
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [activeInsight, setActiveInsight] = React.useState<number | null>(null);

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

  const radarData = [
    { subject: 'Focus', A: 120, fullMark: 150 },
    { subject: 'Efficiency', A: 98, fullMark: 150 },
    { subject: 'Clutter', A: 86, fullMark: 150 },
    { subject: 'Redundancy', A: 99, fullMark: 150 },
    { subject: 'Optimization', A: 85, fullMark: 150 },
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
      icon: AlertTriangle, 
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    { 
      title: "Neural Efficiency", 
      desc: "System focus is currently at 72% of potential.", 
      icon: Zap, 
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    { 
      title: "Entropy Alert", 
      desc: "Storage fragmentation is increasing in the Media sector.", 
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
          {/* Neural Balance Radar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[2.5rem] p-8 bg-white relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Brain size={20} className="text-brand-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Neural Balance</h3>
              </div>
              <div className="text-xs font-bold text-muted">v2.4</div>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} />
                  <ReRadar
                    name="System"
                    dataKey="A"
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.05}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 pt-6 border-t border-zinc-50 flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Focus</p>
                <p className="text-lg font-bold text-brand-500">82%</p>
              </div>
              <div className="w-px h-8 bg-zinc-100" />
              <div className="text-center flex-1">
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Clarity</p>
                <p className="text-lg font-bold text-accent-500">64%</p>
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
                onMouseEnter={() => setActiveInsight(idx)}
                onMouseLeave={() => setActiveInsight(null)}
                className={cn(
                  "p-6 rounded-[2rem] border transition-all cursor-pointer group",
                  activeInsight === idx 
                    ? "bg-brand-500 border-brand-500 text-white shadow-2xl shadow-brand-200" 
                    : "bg-white border-zinc-100 hover:border-brand-200"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    activeInsight === idx ? "bg-white/10 text-white" : cn(insight.bg, insight.color)
                  )}>
                    <insight.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{insight.title}</h4>
                    <p className={cn(
                      "text-xs font-medium leading-relaxed",
                      activeInsight === idx ? "text-brand-50" : "text-zinc-500"
                    )}>{insight.desc}</p>
                  </div>
                  <ArrowRight size={14} className={cn(
                    "mt-1 transition-transform group-hover:translate-x-1",
                    activeInsight === idx ? "text-white" : "text-zinc-300"
                  )} />
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

                  <div className="prose prose-zinc max-w-none prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:text-muted prose-p:leading-relaxed prose-p:text-lg prose-li:text-muted prose-strong:text-brand-700 prose-h1:text-4xl prose-h1:mb-8 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6">
                    <div className="markdown-body">
                      <Markdown>{analysis || ""}</Markdown>
                    </div>
                  </div>
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
                    <button className="px-10 py-4 bg-brand-500 text-white rounded-2xl text-xs font-bold tracking-widest uppercase hover:bg-brand-600 transition-all shadow-xl shadow-brand-200 flex items-center gap-3 group">
                      Execute Strategic Detox
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
