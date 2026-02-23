import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Trash2, 
  Sparkles, 
  Settings, 
  ShieldCheck, 
  BarChart3,
  Menu,
  X,
  Wind
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'analysis', label: 'AI Intelligence', icon: Sparkles },
    { id: 'cleanup', label: 'Cleanup', icon: Trash2 },
    { id: 'wellness', label: 'Wellness', icon: Wind },
    { id: 'stats', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div 
      className={cn(
        "h-screen bg-white border-r border-zinc-200/60 transition-all duration-500 ease-in-out flex flex-col z-50",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-8 flex items-center justify-between">
        {isOpen ? (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 font-bold text-lg tracking-tight"
          >
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <Wind size={18} />
            </div>
            <span>DataDetox</span>
          </motion.div>
        ) : (
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white mx-auto">
            <Wind size={18} />
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
              activeTab === item.id 
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-transform duration-200 group-hover:scale-110",
              activeTab === item.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-900"
            )} />
            {isOpen && (
              <span className="text-sm font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            )}
            {activeTab === item.id && !isOpen && (
              <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-zinc-100">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all group",
            !isOpen && "justify-center"
          )}
        >
          <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" />
          {isOpen && <span className="text-sm font-medium">Settings</span>}
        </button>
      </div>
    </div>
  );
};
