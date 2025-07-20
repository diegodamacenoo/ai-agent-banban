import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

interface PeriodoRetencaoProps {
  periodoRetencao: string;
  setPeriodoRetencao: (value: string) => void;
}

export function PeriodoRetencao({ periodoRetencao, setPeriodoRetencao }: PeriodoRetencaoProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="periodoRetencao">PerÃ­odo de retenÃ§Ã£o de dados</Label>
          <Select value={periodoRetencao} onValueChange={setPeriodoRetencao}>
            <SelectTrigger id="periodoRetencao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90">90 dias apÃ³s baixa de estoque</SelectItem>
              <SelectItem value="180">6 meses</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
              <SelectItem value="indefinido">Indefinido (manutenÃ§Ã£o manual)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Define por quanto tempo os dados sensÃ­veis (como histÃ³rico de vendas, alertas,
            notas fiscais associadas a CPFs de clientes) serÃ£o mantidos no sistema.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">BenefÃ­cios:</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Atender Ã  LGPD sem reter dados desnecessÃ¡rios</li>
            <li>Limitar o volume de dados antigos para melhorar a performance</li>
            <li>Proteger a empresa de possÃ­veis vazamentos histÃ³ricos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 
