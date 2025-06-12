"use client";

import { useState, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Download, Calendar as CalendarIcon, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PageErrorBoundary } from "@/components/ui/error-boundary";
import { SkeletonReportTable } from "@/components/ui/skeleton-loader";

// Tipos
interface GeneratedReport {
  id: string;
  title: string;
  created_at: string;
  file_url: string;
}

// Dados mock para fallback
const MOCK_REPORTS: GeneratedReport[] = [
  {
    id: '1',
    title: 'Relatório de Vendas - Dezembro 2024',
    created_at: '2024-12-15T14:30:00Z',
    file_url: '/mock/reports/dummy.pdf'
  },
  {
    id: '2',
    title: 'Análise de Performance - Q4 2024',
    created_at: '2024-12-10T09:15:00Z',
    file_url: '/mock/reports/dummy.pdf'
  },
  {
    id: '3',
    title: 'Relatório de Estoque - Novembro 2024',
    created_at: '2024-11-28T16:45:00Z',
    file_url: '/mock/reports/dummy.pdf'
  }
];



export default function ReportsPage() {
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseClient();

        let query = supabase
          .from('generated_reports')
          .select('id, title, created_at, file_url')
          .order('created_at', { ascending: false });

        // Aplicar filtro de data se definido
        if (dateFrom) {
          query = query.gte('created_at', dateFrom.toISOString());
        }
        if (dateTo) {
          query = query.lte('created_at', dateTo.toISOString());
        }

        const { data, error } = await query;

        if (!error && data && data.length > 0) {
          setReports(data);
        } else {
          // Se não há dados ou erro, usar dados mock
          console.log('Usando dados mock - tabela vazia ou erro:', error);
          setReports(MOCK_REPORTS);
        }
      } catch (error) {
        console.log('Usando dados mock - Supabase não disponível:', error);
        setReports(MOCK_REPORTS);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [dateFrom, dateTo]);

  const handleDownload = (fileUrl: string, title: string) => {
    window.open(fileUrl, '_blank');
  };

  const columnHelper = createColumnHelper<GeneratedReport>();

  const columns: ColumnDef<GeneratedReport, any>[] = [
    columnHelper.accessor('title', {
      header: 'Título',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{info.getValue()}</span>
        </div>
      ),
    }),
    columnHelper.accessor('created_at', {
      header: 'Data de Criação',
      cell: (info) => {
        const date = new Date(info.getValue());
        return (
          <div className="text-sm text-muted-foreground">
            {format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: () => (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          Concluído
        </Badge>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: (props) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload(props.row.original.file_url, props.row.original.title)}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: reports,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <PageErrorBoundary>
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Relatórios</h2>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {dateFrom ? (
                    dateTo ? (
                      <>
                        {format(dateFrom, 'dd/MM/yy', { locale: ptBR })} -{' '}
                        {format(dateTo, 'dd/MM/yy', { locale: ptBR })}
                      </>
                    ) : (
                      format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })
                    )
                  ) : (
                    'Filtrar por data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data inicial</label>
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data final</label>
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      locale={ptBR}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={clearDateFilter}>
                      Limpar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-1" />
              Gerar Relatório
            </Button>
          </div>
        </div>
      </header>
      <div className="p-6 space-y-6">

        {/* Filtros aplicados */}
        {(dateFrom || dateTo) && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Filtros aplicados:
              {dateFrom && (
                <span className="ml-1">
                  De {format(dateFrom, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
              {dateTo && (
                <span className="ml-1">
                  Até {format(dateTo, 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
            </span>
            <Button variant="ghost" size="sm" onClick={clearDateFilter}>
              Remover filtros
            </Button>
          </div>
        )}

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para download
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Último Relatório
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.length > 0
                  ? format(new Date(reports[0].created_at), 'dd/MM', { locale: ptBR })
                  : '--'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {reports.length > 0
                  ? format(new Date(reports[0].created_at), 'yyyy', { locale: ptBR })
                  : 'Nenhum relatório'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.filter(report => {
                  const reportDate = new Date(report.created_at);
                  const now = new Date();
                  return reportDate.getMonth() === now.getMonth() &&
                    reportDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Relatórios gerados
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <SkeletonReportTable rows={5} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Relatórios</CardTitle>
              <CardDescription>
                {reports.length} relatórios encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Nenhum relatório encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageErrorBoundary>
  );
}
