import React from 'react';

interface ModuleCardProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, children }) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      {children}
    </div>
  );
};
