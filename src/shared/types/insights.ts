export type Priority = 'critical' | 'attention' | 'warning' | 'opportunity' | 'info' | 'success';

export type IconName = 'package' | 'alert-triangle' | 'dollar-sign' | 'shuffle' | 'trending-up' | 'award' | 'undo-2' | 'trending-down' | 'clock' | 'tag';

export interface Insight {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  icon: IconName;
  actions?: {
    label: string;
    url: string;
  }[];
} 
