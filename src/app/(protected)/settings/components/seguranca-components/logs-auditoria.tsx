import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { InfoIcon, FilterIcon, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Download, Search, FileText, Database } from "lucide-react"; 
import { useAuditLogs } from "@/shared/hooks/useAuditLogs"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/shared/ui/dropdown-menu";
import { DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { useState } from "react";
import { SkeletonAuditTable } from "@/shared/ui/skeleton-loader";

interface LogsAuditoriaProps { className?: string; }

export default function LogsAuditoria() {
  const { logs, pagination, error, filters, setFilters, clearFilters, currentPage, nextPage, previousPage, refresh, applyFilters, searchText, setSearchText, exportLogs, isExporting, exportError, isLoading } = useAuditLogs();

  const [isFiltering, setIsFiltering] = useState(false);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
        </div>
      ))}
    </div>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-8">
      <InfoIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum log encontrado</h3>
      <p className="mt-1 text-sm text-gray-500">
        Tente ajustar os filtros ou verificar se hÃ¡ atividade registrada.
      </p>
      <Button
        variant="outline"
        onClick={clearFilters}
        className="mt-4"
      >
        Limpar filtros
      </Button>
    </div>
  );



  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        {/* Info sobre retenÃ§Ã£o de logs */}
        <div className="flex items-center gap-2">
          <InfoIcon className="text-blue-500 w-5 h-5" />
          <p className="text-sm text-muted-foreground">
            Logs de auditoria sÃ£o mantidos por no mÃ­nimo 6 meses e sÃ£o somente leitura para garantir a integridade dos registros.
          </p>
        </div>

        {/* Busca Global */}
        <div className="space-y-2">
          <Label htmlFor="busca">Busca nos logs</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input id="busca" placeholder="Buscar em todos os campos..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-10" />
          </div>
        </div>


        {/* AÃ§Ãµes dos filtros e exportaÃ§Ã£o */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button onClick={() => setIsFiltering(!isFiltering)} variant={isFiltering ? "default" : "outline"} size="sm" className="gap-2" disabled={isLoading}>
              <FilterIcon className="w-4 h-4" />
              {isFiltering ? "Esconder filtros" : "Filtrar logs"}
            </Button>
            {isFiltering && (
              <Button onClick={clearFilters} variant="outline" size="sm" disabled={isLoading}>
                Limpar filtros
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {/* BotÃµes de ExportaÃ§Ã£o */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={isLoading || isExporting}>
                  <FileText className="w-4 h-4" />
                  {isExporting ? 'Exportando...' : 'Exportar'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportLogs('csv', 1000)}>CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportLogs('json', 1000)}>JSON</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={refresh} variant="ghost" size="sm" className="gap-2" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {isFiltering && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtroData">Data inÃ­cio</Label>
              <Input id="filtroDataInicio" placeholder="DD/MM/AAAA" value={filters.dateFrom} onChange={(e) => setFilters({ dateFrom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtroDataFim">Data fim</Label>
              <Input id="filtroDataFim" placeholder="DD/MM/AAAA" value={filters.dateTo} onChange={(e) => setFilters({ dateTo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtroAcao">Tipo de aÃ§Ã£o</Label>
              <Select value={filters.actionType || "all"} onValueChange={(value) => setFilters({ actionType: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar aÃ§Ã£o..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as aÃ§Ãµes</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="password_changed">AlteraÃ§Ã£o de senha</SelectItem>
                  <SelectItem value="profile_updated">AtualizaÃ§Ã£o de perfil</SelectItem>
                  <SelectItem value="data_export">ExportaÃ§Ã£o de dados</SelectItem>
                  <SelectItem value="mfa">AutenticaÃ§Ã£o 2FA</SelectItem>
                  <SelectItem value="audit_logs">Logs de auditoria</SelectItem>
                  <SelectItem value="security_alert_settings_updated">ConfiguraÃ§Ã£o de alertas</SelectItem>
                  <SelectItem value="organization_settings_updated">ConfiguraÃ§Ã£o da organizaÃ§Ã£o</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filtroIP">IP</Label>
              <Input id="filtroIP" placeholder="Ex: 192.168.1.1" value={filters.ipAddress} onChange={(e) => setFilters({ ipAddress: e.target.value })} />
            </div>
          </div>
        )}

        {/* Alertas de erro */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>)
        }
        {exportError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro na exportaÃ§Ã£o: {exportError}
            </AlertDescription>
          </Alert>)}

        {/* Tabela de logs */}
        {isLoading ? (
          <SkeletonAuditTable rows={6} />
        ) : logs.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UsuÃ¡rio</TableHead>
                  <TableHead>AÃ§Ã£o</TableHead>
                  <TableHead>Data e hora</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Dispositivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>              
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.usuario}</TableCell>
                      <TableCell>{log.acao}</TableCell>
                      <TableCell>{log.data}</TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>{log.dispositivo}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState />
        )}

        {/* EstatÃ­sticas e PaginaÃ§Ã£o */}
        {pagination && (
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">
                Exibindo {logs.length} de {pagination.total} registros {pagination.totalPages > 1 && ` (PÃ¡gina ${currentPage} de ${pagination.totalPages})`}
              </p>
              {searchText && (
                <p className="text-xs text-blue-600">
                  Filtrados por busca: "{searchText}"
                </p>)
              }
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousPage}
                  disabled={!pagination.hasPreviousPage || isLoading}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                <span className="text-sm text-gray-500">
                  {currentPage} / {pagination.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={!pagination.hasNextPage || isLoading}
                  className="gap-1"
                >
                  PrÃ³ximo
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
