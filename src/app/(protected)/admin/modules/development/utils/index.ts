// Development utilities and helpers

export interface DevToolConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  status: 'healthy' | 'warning' | 'error';
  href: string;
  enabled: boolean;
}

export interface HealthMetrics {
  score: number;
  uptime: string;
  lastCheck: Date;
  issues: HealthIssue[];
}

export interface HealthIssue {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  module?: string;
  timestamp: Date;
  resolved: boolean;
}

// Color utilities for consistent theming
export const getColorClasses = (color: string) => {
  const colors = {
    blue: {
      icon: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      button: 'from-blue-500 to-blue-600'
    },
    green: {
      icon: 'text-green-500',
      bg: 'bg-green-50',
      border: 'border-green-200',
      button: 'from-green-500 to-green-600'
    },
    purple: {
      icon: 'text-purple-500',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      button: 'from-purple-500 to-purple-600'
    },
    orange: {
      icon: 'text-orange-500',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      button: 'from-orange-500 to-orange-600'
    },
    red: {
      icon: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      button: 'from-red-500 to-red-600'
    }
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

// Status utilities
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy':
    case 'completed':
    case 'positive':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
    case 'negative':
      return 'text-red-500';
    case 'in-progress':
      return 'text-blue-500';
    default:
      return 'text-gray-500';
  }
};

// Progress calculation utilities
export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

export const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-blue-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Animation utilities
export const ANIMATION_CONFIG = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out'
  }
};

// Validation utilities
export const validateSection = (sectionId: string, sections: any[]): boolean => {
  return sections.some(section => section.id === sectionId);
};

export const formatTimeEstimate = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}min` 
    : `${hours}h`;
};

// Development metrics utilities
export const formatMetricValue = (value: number | string, type: 'number' | 'percentage' | 'time'): string => {
  switch (type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'percentage':
      return `${value}%`;
    case 'time':
      return String(value);
    default:
      return String(value);
  }
};

// Storage utilities for persistence
export const STORAGE_KEYS = {
  CURRENT_SECTION: 'dev_guide_current_section',
  PROGRESS_DATA: 'dev_guide_progress_data',
  USER_PREFERENCES: 'dev_guide_preferences'
};

export const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.debug('Failed to save to localStorage:', error);
  }
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.debug('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

// Development constants
export const DEV_GUIDE_CONFIG = {
  SCROLL_OFFSET: 80,
  DEBOUNCE_DELAY: 300,
  AUTO_SAVE_INTERVAL: 5000,
  MAX_RECENT_ACTIVITIES: 10,
  HEALTH_CHECK_INTERVAL: 0, // Desabilitado temporariamente
  PROGRESS_ANIMATION_DELAY: 100
};

// Module validation helpers
export const REQUIRED_FILES = {
  STANDARD: [
    'module.json',
    'README.md',
    'types/index.ts',
    'services/index.ts'
  ],
  CUSTOM: [
    'module.json',
    'README.md',
    'types/index.ts',
    'services/index.ts',
    'integrations/api-config.json'
  ]
};

export const REQUIRED_FOLDERS = {
  STANDARD: [
    'types',
    'services',
    'tests'
  ],
  CUSTOM: [
    'types',
    'services',
    'tests',
    'integrations'
  ]
};

export const isValidModuleStructure = (
  moduleType: 'standard' | 'custom',
  files: string[],
  folders: string[]
): { valid: boolean; missing: string[] } => {
  const requiredFiles = REQUIRED_FILES[moduleType.toUpperCase() as keyof typeof REQUIRED_FILES];
  const requiredFolders = REQUIRED_FOLDERS[moduleType.toUpperCase() as keyof typeof REQUIRED_FOLDERS];
  
  const missingFiles = requiredFiles.filter(file => !files.includes(file));
  const missingFolders = requiredFolders.filter(folder => !folders.includes(folder));
  
  const missing = [...missingFiles, ...missingFolders];
  
  return {
    valid: missing.length === 0,
    missing
  };
};

// Export default configuration
export const DEFAULT_DEV_CONFIG = {
  sections: 6,
  autoSave: true,
  showAnimations: true,
  compactMode: false,
  debugMode: false
};