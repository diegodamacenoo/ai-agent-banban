import React from 'react';

interface AlertItemProps {
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

export const AlertItem: React.FC<AlertItemProps> = ({ message, timestamp, severity }) => {
  const getSeverityColor = () => {
    switch (severity) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="border-b border-gray-200 py-2">
      <p className="text-sm">{message}</p>
      <p className={`text-xs ${getSeverityColor()}`}>{timestamp} - {severity.toUpperCase()}</p>
    </div>
  );
};
