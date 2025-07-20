import React from 'react';

interface AlertConfigurationFormProps {
  initialThreshold: number;
  onSave: (threshold: number) => void;
}

export const AlertConfigurationForm: React.FC<AlertConfigurationFormProps> = ({ initialThreshold, onSave }) => {
  const [threshold, setThreshold] = React.useState(initialThreshold);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(threshold);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
          Limite de Alerta
        </label>
        <input
          type="number"
          id="threshold"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Salvar Configuração
      </button>
    </form>
  );
};
