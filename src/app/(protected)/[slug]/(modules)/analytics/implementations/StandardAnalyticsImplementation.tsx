'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

// AIDEV-TODO: Implementar a UI completa para a implementação Padrão do módulo de Analytics.
// Esta é uma implementação de placeholder.

interface ModuleProps {
  params: { slug: string };
  config: any;
  implementation: any;
}

export default function StandardAnalyticsImplementation({ params, config, implementation }: ModuleProps) {
  return (
    <div className="p-6">
      <Card className="border-purple-500">
        <CardHeader>
          <CardTitle className="text-purple-700">Módulo de Analytics (Implementação Padrão)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Este é o componente de fallback para análises gerais.</p>
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
