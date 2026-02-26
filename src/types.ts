export interface StorageItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'app';
  size: number; // in bytes
  lastAccessed: string;
  category: 'work' | 'media' | 'system' | 'other' | 'junk';
  isDuplicate?: boolean;
  path: string;
  confidenceScore?: number; // 0-100
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ForecastPoint {
  date: string;
  predictedSize: number;
}

export interface WellnessMetric {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

export interface DashboardData {
  totalStorage: number;
  usedStorage: number;
  wellnessScore: number;
  items: StorageItem[];
  metrics: WellnessMetric[];
  forecast: ForecastPoint[];
  cleanupGoal?: number; // in bytes
}
