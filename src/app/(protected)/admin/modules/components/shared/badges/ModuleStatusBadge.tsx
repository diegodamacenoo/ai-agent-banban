import React from 'react';

interface ModuleStatusBadgeProps {
  status: 'active' | 'inactive' | 'pending';
}

export const ModuleStatusBadge: React.FC<ModuleStatusBadgeProps> = ({ status }) => {
  const getBadgeColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
