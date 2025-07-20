import { useState } from 'react';
import { Card, CardContent } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Label } from "@/shared/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";

// Mock de dados de histÃ³rico
interface NotificacaoHistorico {
  id: string;
  dataHora: Date;
  tipo: string;
  canal: string;
  status: "sucesso" | "falha";
  mensagem: string;
}

export function HistoricoNotificacoes() {
  // Mock de notificaÃ§Ãµes
  const [historico] = useState<NotificacaoHistorico[]>([
    {
      id: "1",
      dataHora: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrÃ¡s
      tipo: "seguranca",
      canal: "email",
      status: "sucesso",
      mensagem: "Login suspeito detectado"
    },
    {
      id: "2",
      dataHora: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrÃ¡s
      tipo: "operacional",
      canal: "whatsapp_sms",
      status: "falha",
      mensagem: "Estoque do produto SKU123 abaixo do mÃ­nimo"
    },
    {
      id: "3",
      dataHora: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 horas atrÃ¡s
      tipo: "administrativo",
      canal: "email",
      status: "sucesso",
      mensagem: "Novo usuÃ¡rio convidado para a plataforma"
    },
    {
      id: "4",
      dataHora: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrÃ¡s
      tipo: "relatorios",
      canal: "email",
      status: "sucesso",
      mensagem: "RelatÃ³rio semanal de vendas"
    }
  ]);

  // Estado para filtros
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // FormataÃ§Ã£o de data e hora
  const formatarDataHora = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  // FunÃ§Ã£o para formatar o tipo de notificaÃ§Ã£o em texto legÃ­vel
  const formatarTipo = (tipo: string) => {
    switch (tipo) {
      case "operacional": return "Operacional";
      case "seguranca": return "SeguranÃ§a";
      case "administrativo": return "Administrativo";
      case "relatorios": return "RelatÃ³rios";
      default: return tipo;
    }
  };

  // FunÃ§Ã£o para formatar o canal em texto legÃ­vel
  const formatarCanal = (canal: string) => {
    switch (canal) {
      case "email": return "E-mail";
      case "whatsapp_sms": return "WhatsApp/SMS";
      case "push_webhook": return "Push/Webhook";
      default: return canal;
    }
  };

  // Aplicar filtros no histÃ³rico
  const historicoFiltrado = historico.filter(item => {
    if (filtroStatus !== "todos" && item.status !== filtroStatus) return false;
    if (filtroTipo !== "todos" && item.tipo !== filtroTipo) return false;
    return true;
  });

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-6">
        {/* Filtros */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Filtros</h4>
            <p className="text-sm text-muted-foreground">Refine o histÃ³rico de notificaÃ§Ãµes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filtro-status">Status</Label>
              <Select 
                value={filtroStatus} 
                onValueChange={setFiltroStatus}
              >
                <SelectTrigger id="filtro-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  <SelectItem value="falha">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filtro-tipo">Tipo de Alerta</Label>
              <Select 
                value={filtroTipo} 
                onValueChange={setFiltroTipo}
              >
                <SelectTrigger id="filtro-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="seguranca">SeguranÃ§a</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="relatorios">RelatÃ³rios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabela de HistÃ³rico */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">HistÃ³rico de Envio</h4>
            <p className="text-sm text-muted-foreground">Registro das Ãºltimas notificaÃ§Ãµes enviadas</p>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoFiltrado.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nenhuma notificaÃ§Ã£o encontrada com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  historicoFiltrado.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatarDataHora(item.dataHora)}</TableCell>
                      <TableCell>{formatarTipo(item.tipo)}</TableCell>
                      <TableCell>{formatarCanal(item.canal)}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "sucesso" ? "default" : "destructive"}>
                          {item.status === "sucesso" ? "Sucesso" : "Falha"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.mensagem}>
                        {item.mensagem}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground">
            Este histÃ³rico exibe as notificaÃ§Ãµes enviadas nos Ãºltimos 30 dias.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 
