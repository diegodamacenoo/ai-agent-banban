"use client";

import { useState, useEffect, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  Filter, 
  Tag,
  Eye
} from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { SkeletonEventList } from "@/components/ui/skeleton-loader";



// Tipos
interface CoreEvent {
  id: string;
  created_at: string;
  event_code: string;
  entity_type: string;
  entity_id?: string;
  metadata?: any;
}

// Dados mock para fallback
const MOCK_EVENTS: CoreEvent[] = [
  {
    id: '1',
    created_at: '2024-12-15T14:30:00Z',
    event_code: 'USER_LOGIN',
    entity_type: 'user',
    entity_id: 'user_123'
  },
  {
    id: '2',
    created_at: '2024-12-15T14:25:00Z',
    event_code: 'PRODUCT_CREATED',
    entity_type: 'product',
    entity_id: 'prod_456'
  },
  {
    id: '3',
    created_at: '2024-12-15T14:20:00Z',
    event_code: 'ORDER_COMPLETED',
    entity_type: 'order',
    entity_id: 'order_789'
  },
  {
    id: '4',
    created_at: '2024-12-15T14:15:00Z',
    event_code: 'USER_LOGOUT',
    entity_type: 'user',
    entity_id: 'user_123'
  },
  {
    id: '5',
    created_at: '2024-12-15T14:10:00Z',
    event_code: 'PAYMENT_PROCESSED',
    entity_type: 'payment',
    entity_id: 'pay_101'
  }
];

const PAGE_SIZE = 40;

export default function EventsPage() {
  const [events, setEvents] = useState<CoreEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async (offset: number = 0, reset: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseClient();
      
      const { data, error: supabaseError } = await supabase
        .from('core_events')
        .select('id, created_at, event_code, entity_type, entity_id, metadata')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (supabaseError) {
        console.log('Usando dados mock - erro Supabase:', supabaseError);
        // Se é primeira carga e há erro, usar dados mock
        if (offset === 0) {
          setEvents(MOCK_EVENTS);
          setHasNextPage(false);
        }
        return;
      }

      if (!data || data.length === 0) {
        if (offset === 0) {
          // Se não há dados na primeira carga, usar mock
          console.log('Usando dados mock - tabela vazia');
          setEvents(MOCK_EVENTS);
          setHasNextPage(false);
        } else {
          // Não há mais dados para carregar
          setHasNextPage(false);
        }
        return;
      }

      if (reset) {
        setEvents(data);
      } else {
        setEvents(prev => [...prev, ...data]);
      }

      // Verifica se há próxima página
      setHasNextPage(data.length === PAGE_SIZE);

    } catch (error) {
      console.log('Usando dados mock - Supabase não disponível:', error);
      if (offset === 0) {
        setEvents(MOCK_EVENTS);
        setHasNextPage(false);
      }
      setError('Erro ao carregar eventos');
    } finally {
      setLoading(false);
      if (offset === 0) setInitialLoading(false);
    }
  }, [loading]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !loading) {
      loadEvents(events.length);
    }
  }, [events.length, hasNextPage, loading, loadEvents]);

  useEffect(() => {
    loadEvents(0, true);
  }, [loadEvents]);

  const handleViewDetails = (event: CoreEvent) => {
    // Noop por enquanto
    console.log('Ver detalhes do evento:', event);
  };

  const getEventCodeVariant = (eventCode: string) => {
    if (eventCode.includes('LOGIN') || eventCode.includes('AUTH')) return 'default';
    if (eventCode.includes('ERROR') || eventCode.includes('FAILED')) return 'destructive';
    if (eventCode.includes('CREATE') || eventCode.includes('COMPLETE')) return 'secondary';
    return 'outline';
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user': return '👤';
      case 'product': return '📦';
      case 'order': return '🛒';
      case 'payment': return '💳';
      default: return '📄';
    }
  };

  const EventItem = ({ index }: { index: number }) => {
    const event = events[index];
    
    if (!event) {
      return (
        <div className="p-4 border-b animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
            <div className="h-8 bg-muted rounded w-20"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4 border-b hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Data e hora */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[140px]">
              <Clock className="w-4 h-4" />
              {format(new Date(event.created_at), 'dd/MM HH:mm', { locale: ptBR })}
            </div>

            {/* Event Code */}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <Badge variant={getEventCodeVariant(event.event_code)}>
                {event.event_code}
              </Badge>
            </div>

            {/* Entity Type */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{getEntityTypeIcon(event.entity_type)}</span>
              <span className="text-sm font-medium">{event.entity_type}</span>
              {event.entity_id && (
                <span className="text-xs text-muted-foreground">({event.entity_id})</span>
              )}
            </div>
          </div>

          {/* Botão Detalhes */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewDetails(event)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Detalhes
          </Button>
        </div>
      </div>
    );
  };

  if (initialLoading) {
    return (
      <PageErrorBoundary>
        <div className="p-6">
          <SkeletonEventList items={8} />
        </div>
      </PageErrorBoundary>
    );
  }

  return (
    <PageErrorBoundary>
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Eventos</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" />
              Período
            </Button>
          </div>
        </div>
      </header>
      <div className="p-6 space-y-6">

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Carregados na sessão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Último Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.length > 0 
                ? format(new Date(events[0].created_at), 'HH:mm', { locale: ptBR })
                : '--'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {events.length > 0 
                ? format(new Date(events[0].created_at), 'dd/MM/yyyy', { locale: ptBR })
                : 'Nenhum evento'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tipos Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(events.map(e => e.entity_type)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Entity types diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Códigos Únicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(events.map(e => e.event_code)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Event codes diferentes
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Lista virtualizada de eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos</CardTitle>
          <CardDescription>
            Carregamento automático conforme você navega
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div style={{ height: '600px' }}>
            <Virtuoso
              data={events}
              endReached={loadMore}
              itemContent={(index) => <EventItem index={index} />}
              components={{
                Footer: () => loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Carregando mais eventos...
                  </div>
                ) : !hasNextPage ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Todos os eventos foram carregados
                  </div>
                ) : null
              }}
            />
          </div>
        </CardContent>
      </Card>
      </div>
    </PageErrorBoundary>
  );
} 