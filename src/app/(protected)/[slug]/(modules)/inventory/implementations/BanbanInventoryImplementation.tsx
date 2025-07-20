'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

// AIDEV-TODO: Implementar a UI completa para a implementação Banban do módulo de Inventário.
// Esta é uma implementação de placeholder.

interface ModuleProps {
  params: { slug: string };
  config: any;
  implementation: any;
}

export default function BanbanInventoryImplementation({ params, config, implementation }: ModuleProps) {
  return (
    <div className="p-6">
      <Card className="border-pink-500">
        <CardHeader>
          <CardTitle className="text-pink-700">Módulo de Inventário (Implementação Banban)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Este é o componente customizado para o cliente Banban.</p>
          <div>
            <h4 className="font-semibold">Dados Recebidos:</h4>
            <pre className="mt-2 rounded-md bg-gray-100 p-4 text-sm">
              <code>
                {
                  JSON.stringify(
                    {
                      tenantSlug: params.slug,
                      implementationKey: implementation.implementation_key,
                      customConfig: config,
                    },
                    null,
                    2
                  )
                }
              </code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
