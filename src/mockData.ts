import { DashboardData, StorageItem } from './types';
import { subDays, subMonths } from 'date-fns';

const generateMockFiles = (): StorageItem[] => {
  const items: StorageItem[] = [
    {
      id: '1',
      name: 'Final_Project_v1.zip',
      type: 'file',
      size: 1024 * 1024 * 450, // 450MB
      lastAccessed: subMonths(new Date(), 3).toISOString(),
      category: 'work',
      path: '/Downloads/Final_Project_v1.zip',
      confidenceScore: 95,
      riskLevel: 'low'
    },
    {
      id: '2',
      name: 'Final_Project_v2_final.zip',
      type: 'file',
      size: 1024 * 1024 * 455, // 455MB
      lastAccessed: subMonths(new Date(), 2).toISOString(),
      category: 'work',
      path: '/Downloads/Final_Project_v2_final.zip',
      isDuplicate: true,
      confidenceScore: 99,
      riskLevel: 'low'
    },
    {
      id: '3',
      name: 'Vacation_Video_RAW.mp4',
      type: 'file',
      size: 1024 * 1024 * 1024 * 2.4, // 2.4GB
      lastAccessed: subMonths(new Date(), 6).toISOString(),
      category: 'media',
      path: '/Videos/Vacation_Video_RAW.mp4',
      confidenceScore: 75,
      riskLevel: 'medium'
    },
    {
      id: '4',
      name: 'Old_Game_Launcher',
      type: 'app',
      size: 1024 * 1024 * 800, // 800MB
      lastAccessed: subMonths(new Date(), 12).toISOString(),
      category: 'other',
      path: '/Applications/Old_Game_Launcher',
      confidenceScore: 88,
      riskLevel: 'low'
    },
    {
      id: '5',
      name: 'Cache_Log_2023.txt',
      type: 'file',
      size: 1024 * 1024 * 120, // 120MB
      lastAccessed: subDays(new Date(), 1).toISOString(),
      category: 'junk',
      path: '/Library/Caches/Cache_Log_2023.txt',
      confidenceScore: 100,
      riskLevel: 'low'
    }
  ];
  return items;
};

const generateForecast = () => {
  return Array.from({ length: 12 }).map((_, i) => ({
    date: subMonths(new Date(), -i).toISOString(),
    predictedSize: 420 + i * 8 + Math.random() * 5
  }));
};

export const mockDashboardData: DashboardData = {
  totalStorage: 1024 * 1024 * 1024 * 512, // 512GB
  usedStorage: 1024 * 1024 * 1024 * 420, // 420GB
  wellnessScore: 68,
  items: generateMockFiles(),
  metrics: [
    { label: 'Digital Focus', value: 72, trend: 'up', status: 'good' },
    { label: 'Storage Efficiency', value: 45, trend: 'down', status: 'warning' },
    { label: 'Organization', value: 58, trend: 'stable', status: 'warning' }
  ],
  forecast: generateForecast()
};
