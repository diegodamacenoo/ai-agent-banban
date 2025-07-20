'use client';

import { X, Package, Store, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/utils/utils';
import { Insight } from '../types';

interface SimpleDrawerProps {
  insight: Insight | null;
  isOpen: boolean;
  onClose: () => void;
}

const getInsightColors = (type: string) => {
  switch (type) {
    case 'critical':
      return { label: 'CRÍTICO', color: 'text-red-600 bg-red-50 border-red-200' };
    case 'attention':
      return { label: 'ATENÇÃO', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    case 'moderate':
      return { label: 'MODERADO', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    case 'opportunity':
      return { label: 'OPORTUNIDADE', color: 'text-green-600 bg-green-50 border-green-200' };
    case 'achievement':
      return { label: 'CONQUISTA', color: 'text-purple-600 bg-purple-50 border-purple-200' };
    default:
      return { label: 'INFO', color: 'text-gray-600 bg-gray-50 border-gray-200' };
  }
};

export function SimpleDrawer({ insight, isOpen, onClose }: SimpleDrawerProps) {
  if (!isOpen || !insight) {
    return null;
  }

  const colors = getInsightColors(insight.type);

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[500px] bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Badge className={cn('text-xs font-semibold', colors.color)}>
                {colors.label}
              </Badge>
              <h2 className="text-xl font-semibold text-gray-900">
                {insight.title}
              </h2>
              <p className="text-sm text-gray-600 max-w-md">
                {insight.naturalLanguageText}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Análise */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Análise Detalhada
            </h3>
            <p className="text-sm text-gray-600">
              {insight.type === 'critical' && 
                "Este insight indica uma situação que requer ação imediata. O estoque baixo pode causar perda de vendas e insatisfação dos clientes."
              }
              {insight.type === 'opportunity' && 
                "Esta é uma oportunidade identificada pelo sistema para aumentar suas vendas e aproveitar tendências do mercado."
              }
              {insight.type === 'achievement' && 
                "Parabéns! Este insight destaca um sucesso alcançado. Continue com as estratégias que estão funcionando bem."
              }
              {insight.type === 'attention' && 
                "Esta situação precisa da sua atenção e pode se tornar crítica se não for resolvida em breve."
              }
              {insight.type === 'moderate' && 
                "Esta é uma informação importante para acompanhar, mas não requer ação urgente."
              }
            </p>
          </div>

          {/* Produtos Afetados */}
          {insight.data.products && insight.data.products.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos Afetados
              </h3>
              <div className="space-y-2">
                {insight.data.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{product}</span>
                    {insight.type === 'critical' && (
                      <Badge variant="destructive" className="text-xs">Crítico</Badge>
                    )}
                    {insight.type === 'opportunity' && (
                      <Badge className="text-xs bg-green-100 text-green-700">Oportunidade</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lojas Afetadas */}
          {insight.data.stores && insight.data.stores.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Lojas Afetadas
              </h3>
              <div className="space-y-2">
                {insight.data.stores.map((store, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{store}</span>
                    <span className="text-xs text-gray-500">Verificar estoque</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Métricas */}
          {insight.data.metrics && Object.keys(insight.data.metrics).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Métricas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(insight.data.metrics).map(([key, value]) => (
                  <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações Recomendadas */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Ações Recomendadas</h3>
            <div className="space-y-3">
              {insight.type === 'critical' && (
                <>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="font-medium text-red-800 mb-1">1. Reposição Urgente</div>
                    <div className="text-sm text-red-600 mb-3">Criar pedido de reposição para entrega em até 24h</div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">
                      Criar Pedido
                    </Button>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="font-medium text-amber-800 mb-1">2. Transferência Entre Lojas</div>
                    <div className="text-sm text-amber-600 mb-3">Verificar estoque em outras lojas</div>
                    <Button size="sm" variant="outline">
                      Ver Disponibilidade
                    </Button>
                  </div>
                </>
              )}

              {insight.type === 'opportunity' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800 mb-1">Criar Promoção</div>
                  <div className="text-sm text-green-600 mb-3">Aproveitar a alta demanda do produto</div>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Configurar Promoção
                  </Button>
                </div>
              )}

              {insight.type === 'attention' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="font-medium text-amber-800 mb-1">Corrigir Problema</div>
                  <div className="text-sm text-amber-600 mb-3">Resolver a inconsistência identificada</div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                    Corrigir Agora
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Histórico */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Histórico</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Insight detectado</span>
                <span>Hoje, 09:15</span>
              </div>
              <div className="flex justify-between">
                <span>Última atualização</span>
                <span>Hoje, 09:10</span>
              </div>
              <div className="flex justify-between">
                <span>Primeira ocorrência</span>
                <span>Hoje, 08:45</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}