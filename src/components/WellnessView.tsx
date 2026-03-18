import React from 'react';
import { motion } from 'motion/react';
import { 
  Wind, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Brain,
  Focus
} from 'lucide-react';
import { WellnessMetric } from '../types';
import { cn } from '../lib/utils';

interface WellnessViewProps {
  metrics: WellnessMetric[];
}

export const WellnessView: React.FC<WellnessViewProps> = ({ metrics }) => {
  const habits = [
    { title: 'Weekly Inbox Zero', description: 'Clear your temporary downloads every Sunday.', icon: Clock, completed: true },
    { title: 'Duplicate Audit', description: 'Run the AI duplicate scanner once a month.', icon: Zap, completed: false },
    { title: 'App Usage Review', description: 'Identify apps not opened in 90 days.', icon: Focus, completed: true },
    { title: 'Cloud Sync Check', description: 'Ensure cloud backups are optimized.', icon: ShieldCheck, completed: false },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-20">
      <header className="text-center space-y-6">
        <h1 className="text-6xl font-bold tracking-tighter text-zinc-900 font-serif italic">Mindful Space</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed text-balance">
          DataDetox helps you maintain a lean, efficient, and stress-free digital environment. 
          Focus on what matters, let AI handle the clutter.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card rounded-[2.5rem] p-10 text-center space-y-6"
          >
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{metric.label}</div>
            <div className="text-6xl font-bold tracking-tighter text-zinc-900">{metric.value}%</div>
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
              metric.status === 'good' ? "bg-zinc-50 text-zinc-900" : "bg-amber-50 text-amber-600"
            )}>
              {metric.status === 'good' ? <ShieldCheck size={12} /> : <Zap size={12} />}
              {metric.status}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="text-3xl font-bold tracking-tight flex items-center gap-4 font-serif italic">
            <Brain className="text-zinc-900" />
            Wellness Habits
          </h3>
          <div className="space-y-4">
            {habits.map((habit, idx) => (
              <motion.div
                key={habit.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="p-8 bg-white rounded-[2rem] border border-zinc-200/60 flex items-start gap-6 hover:border-zinc-900/20 transition-all group shadow-sm hover:shadow-md"
              >
                <div className={cn(
                  "p-4 rounded-2xl transition-all duration-300",
                  habit.completed ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" : "bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100"
                )}>
                  <habit.icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-zinc-900 text-lg">{habit.title}</h4>
                    {habit.completed && <CheckCircle2 size={20} className="text-zinc-900" />}
                  </div>
                  <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">{habit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <h3 className="text-3xl font-bold tracking-tight font-serif italic">Detox Insights</h3>
          <div className="glass-card rounded-[2.5rem] p-12 space-y-10">
            <div className="space-y-3">
              <h4 className="font-bold text-xl">Digital Minimalism</h4>
              <p className="text-sm text-zinc-500 leading-relaxed text-balance">
                By removing 42GB of redundant data last month, you've reduced your device's energy consumption by approximately 12% and improved boot times by 4 seconds.
              </p>
            </div>
            <div className="h-px bg-zinc-100" />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Focus Score Improvement</span>
                <span className="text-xl font-bold text-zinc-900">+18%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Storage Stress Level</span>
                <span className="text-xl font-bold text-zinc-900">Low</span>
              </div>
            </div>
            <button className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 group shadow-2xl shadow-zinc-200">
              View Detailed Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
