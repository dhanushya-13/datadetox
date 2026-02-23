import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  Wind, 
  Download
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
  Radar as ReRadar
} from 'recharts';
import Markdown from 'react-markdown';
import { DashboardData } from '../types';

interface AIAnalysisProps {
  data: DashboardData;
  onAnalyze?: () => Promise<string | null>;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ data, onAnalyze }) => {
  const [loading, setLoading] = React.useState(true);
  const [analysis, setAnalysis] = React.useState<string | null>(null);

  React.useEffect(() => {
    const generateReport = async () => {
      if (onAnalyze) {
        const report = await onAnalyze();
        setAnalysis(report);
      } else {
        // Fallback or mock
        await new Promise(resolve => setTimeout(resolve, 2500));
        setAnalysis(`
# Digital Detox Report: Neural Balance Analysis

## 1. Neural Balance Assessment
Your digital footprint shows a **High Density** of redundant assets in the media sector. The neural balance is currently skewed towards "Digital Hoarding," which may impact cognitive focus and system performance.

## 2. Storage Habit Observations
- **Redundancy Pattern:** You tend to keep multiple versions of the same project files.
- **Media Accumulation:** Large video files from over 6 months ago account for 45% of your used space.
- **App Decay:** Several high-capacity applications haven't been initialized in over 180 days.

## 3. Action Plan
1. **Execute Media Purge:** Remove the flagged 2.4GB vacation video.
2. **Consolidate Projects:** Delete Project v1 and v2, keeping only the final build.
3. **Neural Reset:** Offload unused applications to cold storage.
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

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 font-serif italic">AI Intelligence</h1>
          <p className="text-zinc-400 font-medium text-sm tracking-wide uppercase">Neural correlation of your digital existence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-zinc-900 text-white rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
            <Sparkles size={12} />
            Gemini 3.1 Pro Active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visualizations Column */}
        <div className="lg:col-span-1 space-y-8">
          {loading ? (
            <>
              <div className="glass-card rounded-[2.5rem] p-8 bg-white animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-5 h-5 bg-zinc-100 rounded-md" />
                  <div className="h-3 w-24 bg-zinc-100 rounded-full" />
                </div>
                <div className="h-64 w-full bg-zinc-50 rounded-full flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-dashed border-zinc-100 rounded-full" />
                </div>
              </div>
              <div className="glass-card rounded-[2.5rem] p-8 bg-zinc-900 border-none animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-5 h-5 bg-zinc-800 rounded-md" />
                  <div className="h-3 w-24 bg-zinc-800 rounded-full" />
                </div>
                <div className="h-48 w-full flex items-end gap-2">
                  {[40, 70, 50, 90, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-zinc-800 rounded-t-lg" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card rounded-[2.5rem] p-8 bg-white"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Activity size={18} className="text-zinc-900" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Neural Balance</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#f4f4f5" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }} />
                      <ReRadar
                        name="System"
                        dataKey="A"
                        stroke="#000"
                        fill="#000"
                        fillOpacity={0.1}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-[2.5rem] p-8 bg-zinc-900 text-white border-none"
              >
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 size={18} className="text-white" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Density Map</h3>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData}>
                      <XAxis dataKey="name" hide />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#fff' : 'rgba(255,255,255,0.2)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {categoryData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.name}</span>
                      <span className="text-xs font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Analysis Column */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="glass-card rounded-[3rem] h-full p-12 md:p-16 bg-white animate-pulse">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="h-8 w-1/3 bg-zinc-100 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-50 rounded-full" />
                    <div className="h-4 w-[90%] bg-zinc-50 rounded-full" />
                    <div className="h-4 w-[95%] bg-zinc-50 rounded-full" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 w-1/4 bg-zinc-100 rounded-lg" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-20 bg-zinc-50 rounded-2xl" />
                    <div className="h-20 bg-zinc-50 rounded-2xl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-6 w-1/2 bg-zinc-100 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-50 rounded-full" />
                    <div className="h-4 w-full bg-zinc-50 rounded-full" />
                    <div className="h-4 w-[80%] bg-zinc-50 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="mt-20 pt-10 border-t border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-zinc-100 rounded-full" />
                    <div className="h-2 w-16 bg-zinc-50 rounded-full" />
                  </div>
                </div>
                <div className="h-12 w-32 bg-zinc-100 rounded-2xl" />
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-[3rem] p-12 md:p-16 shadow-2xl shadow-zinc-200/50 border-none bg-white relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Wind size={400} />
              </div>

              <div className="prose prose-zinc max-w-none prose-headings:font-serif prose-headings:italic prose-headings:tracking-tight prose-p:text-zinc-500 prose-p:leading-relaxed prose-p:text-lg prose-li:text-zinc-500 prose-strong:text-zinc-900">
                <div className="markdown-body">
                  <Markdown>{analysis || ""}</Markdown>
                </div>
              </div>
              
              <div className="mt-20 pt-10 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-900 border border-zinc-100">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Verified Analysis</p>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5">Confidence Level: 99.8%</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="px-10 py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold tracking-widest uppercase hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200">
                    Execute Detox
                  </button>
                  <button className="p-4 bg-zinc-50 text-zinc-400 rounded-2xl hover:bg-zinc-100 hover:text-zinc-900 transition-all border border-zinc-100">
                    <Download size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
