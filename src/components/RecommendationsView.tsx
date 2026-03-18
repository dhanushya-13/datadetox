import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Shield, 
  Trash2, 
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DashboardData, StorageItem } from '../types';
import { cn } from '../lib/utils';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'storage' | 'privacy' | 'organization' | 'wellness';
  actionLabel: string;
  icon: React.ReactNode;
}

interface RecommendationsViewProps {
  data: DashboardData;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({ data }) => {
  const [recommendations, setRecommendations] = React.useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const dataSummary = {
        usedStorage: (data.usedStorage / (1024 ** 3)).toFixed(2) + ' GB',
        totalStorage: (data.totalStorage / (1024 ** 3)).toFixed(2) + ' GB',
        wellnessScore: data.wellnessScore,
        itemCount: data.items.length,
        categories: data.items.reduce((acc: any, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {}),
        riskLevels: data.items.reduce((acc: any, item) => {
          acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
          return acc;
        }, {}),
        duplicates: data.items.filter(i => i.isDuplicate).length
      };

      const prompt = `
        As a Digital Wellness AI, analyze this user's data state and provide 4-5 highly specific, actionable recommendation tips.
        
        User Data Summary:
        ${JSON.stringify(dataSummary, null, 2)}
        
        Return the response as a JSON array of objects with the following structure:
        {
          "id": "unique-id",
          "title": "Short catchy title",
          "description": "Detailed explanation of why this is recommended and how it helps",
          "impact": "high" | "medium" | "low",
          "category": "storage" | "privacy" | "organization" | "wellness",
          "actionLabel": "Call to action text (e.g., 'Clean Now', 'Review Access')"
        }
        
        Focus on:
        1. Storage optimization (especially if used storage is high)
        2. Privacy risks (based on riskLevels)
        3. Organization (based on categories and duplicates)
        4. Digital wellness (based on wellnessScore)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: [{ parts: [{ text: prompt }] }],
      });

      const responseText = response.text || '';
      // Clean up potential markdown code blocks if the model returns them
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
      
      const result = JSON.parse(cleanJson || '[]');
      
      const mappedRecommendations = result.map((rec: any) => ({
        ...rec,
        icon: getIconForCategory(rec.category)
      }));

      setRecommendations(mappedRecommendations);
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setError('The neural engine is currently recalibrating. Please try again in a moment.');
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'storage': return <Trash2 size={20} />;
      case 'privacy': return <Shield size={20} />;
      case 'organization': return <Zap size={20} />;
      case 'wellness': return <Sparkles size={20} />;
      default: return <Lightbulb size={20} />;
    }
  };

  React.useEffect(() => {
    generateRecommendations();
  }, []);

  return (
    <div className="p-6 lg:p-12 max-w-7xl mx-auto w-full space-y-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-zinc-200">
            <Lightbulb size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-zinc-900">Neural Recommendations</h1>
            <p className="text-zinc-500 font-medium">Personalized intelligence based on your digital footprint</p>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-white rounded-3xl border border-zinc-100 animate-pulse p-8 space-y-4">
              <div className="h-6 bg-zinc-50 rounded-full w-3/4" />
              <div className="h-4 bg-zinc-50 rounded-full w-full" />
              <div className="h-4 bg-zinc-50 rounded-full w-5/6" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-100 rounded-3xl p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto">
            <AlertCircle size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-amber-900">Neural Sync Interrupted</h3>
            <p className="text-amber-700 mt-2">{error}</p>
          </div>
          <button 
            onClick={generateRecommendations}
            className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-all flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={20} />
            Retry Synthesis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white rounded-[2rem] border border-zinc-100 p-8 hover:shadow-2xl hover:shadow-zinc-200/50 transition-all duration-500 flex flex-col"
              >
                <div className="flex-1 space-y-3">
                  <h3 className="text-2xl font-bold tracking-tight text-zinc-900 group-hover:text-brand-600 transition-colors">
                    {rec.title}
                  </h3>
                  <p className="text-zinc-500 leading-relaxed font-medium">
                    {rec.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
