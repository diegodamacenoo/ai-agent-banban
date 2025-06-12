import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mock de dados de histórico
interface NotificacaoHistorico {
  id: string;
  dataHora: Date;
  tipo: string;
  canal: string;
  status: "sucesso" | "falha";
  mensagem: string;
}

export function HistoricoNotificacoes() {
  // Mock de notificações
  const [historico] = useState<NotificacaoHistorico[]>([
    {
      id: "1",
      dataHora: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
      tipo: "seguranca",
      canal: "email",
      status: "sucesso",
      mensagem: "Login suspeito detectado"
    },
    {
      id: "2",
      dataHora: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
      tipo: "operacional",
      canal: "whatsapp_sms",
      status: "falha",
      mensagem: "Estoque do produto SKU123 abaixo do mínimo"
    },
    {
      id: "3",
      dataHora: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 horas atrás
      tipo: "administrativo",
      canal: "email",
      status: "sucesso",
      mensagem: "Novo usuário convidado para a plataforma"
    },
    {
      id: "4",
      dataHora: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      tipo: "relatorios",
      canal: "email",
      status: "sucesso",
      mensagem: "Relatório semanal de vendas"
    }
  ]);

  // Estado para filtros
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Formatação de data e hora
  const formatarDataHora = (data: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  // Função para formatar o tipo de notificação em texto legível
  const formatarTipo = (tipo: string) => {
    switch (tipo) {
      case "operacional": return "Operacional";
      case "seguranca": return "Segurança";
      case "administrativo": return "Administrativo";
      case "relatorios": return "Relatórios";
      default: return tipo;
    }
  };

  // Função para formatar o canal em texto legível
  const formatarCanal = (canal: string) => {
    switch (canal) {
      case "email": return "E-mail";
      case "whatsapp_sms": return "WhatsApp/SMS";
      case "push_webhook": return "Push/Webhook";
      default: return canal;
    }
  };

  // Aplicar filtros no histórico
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
            <p className="text-sm text-muted-foreground">Refine o histórico de notificações</p>
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
                  <SelectItem value="seguranca">Segurança</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="relatorios">Relatórios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tabela de Histórico */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Histórico de Envio</h4>
            <p className="text-sm text-muted-foreground">Registro das últimas notificações enviadas</p>
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
                      Nenhuma notificação encontrada com os filtros selecionados.
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
            Este histórico exibe as notificações enviadas nos últimos 30 dias.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 