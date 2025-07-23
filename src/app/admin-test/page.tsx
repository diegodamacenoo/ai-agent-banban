export default function AdminTestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Test Page</h1>
      <p className="mt-4">Esta é uma página de teste sem hooks complexos.</p>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Status</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Página carregada com sucesso</li>
          <li>Sem erros de hooks</li>
          <li>Renderização server-side</li>
        </ul>
      </div>
    </div>
  );
}