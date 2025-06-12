import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PeriodoRetencaoProps {
  periodoRetencao: string;
  setPeriodoRetencao: (value: string) => void;
}

export function PeriodoRetencao({ periodoRetencao, setPeriodoRetencao }: PeriodoRetencaoProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="periodoRetencao">Período de retenção de dados</Label>
          <Select value={periodoRetencao} onValueChange={setPeriodoRetencao}>
            <SelectTrigger id="periodoRetencao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">90 dias após baixa de estoque</SelectItem>
              <SelectItem value="180">6 meses</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
              <SelectItem value="indefinido">Indefinido (manutenção manual)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Define por quanto tempo os dados sensíveis (como histórico de vendas, alertas,
            notas fiscais associadas a CPFs de clientes) serão mantidos no sistema.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Benefícios:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Atender à LGPD sem reter dados desnecessários</li>
            <li>Limitar o volume de dados antigos para melhorar a performance</li>
            <li>Proteger a empresa de possíveis vazamentos históricos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 