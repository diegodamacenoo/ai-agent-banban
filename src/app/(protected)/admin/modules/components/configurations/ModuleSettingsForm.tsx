import React from 'react';

interface ModuleSettingsFormProps {
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent) => void;
}

export const ModuleSettingsForm: React.FC<ModuleSettingsFormProps> = ({ children, onSubmit }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {children}
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
        Salvar Configurações
      </button>
    </form>
  );
};
