export type InsightType = 'critical' | 'attention' | 'moderate' | 'opportunity' | 'achievement';

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  naturalLanguageText: string;
  isConnected?: boolean;
  connectionText?: string;
  badges?: string[];
  data: {
    products?: string[];
    stores?: string[];
    suppliers?: string[];
    metrics?: { [key: string]: number | string };
  };
  actions: InsightAction[];
  createdAt: Date;
  isNew?: boolean;
  trend?: 'up' | 'down' | 'stable';
  urgency?: 'urgent' | 'today' | 'tomorrow' | 'week';
}

export interface InsightAction {
  id: string;
  label: string;
  type: 'navigation' | 'task' | 'share' | 'dismiss';
  payload: any;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedInsightId?: string;
  suggestions?: string[];
}

export interface ChatState {
  isOpen: boolean;
  isExpanded: boolean;
  messages: ChatMessage[];
  currentContext?: Insight;
  suggestions: string[];
  isTyping: boolean;
}