import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangleIcon, UserXIcon } from "lucide-react";

interface AnonimizacaoExclusaoProps {
  tipoExclusao: string;
  setTipoExclusao: (value: string) => void;
}

export function AnonimizacaoExclusao({ tipoExclusao, setTipoExclusao }: AnonimizacaoExclusaoProps) {
  const [confirmacao, setConfirmacao] = React.useState("");
  
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="text-amber-500 w-5 h-5" />
          <p className="text-sm text-muted-foreground">
            Atenção: A exclusão será irreversível e pode impactar históricos associados
            (ex: quem criou um alerta ou nota manual).
          </p>
        </div>
        <RadioGroup value={tipoExclusao} onValueChange={setTipoExclusao} className="space-y-3">
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="anonimizacao" id="anonimizacao" />
            <div className="grid gap-1.5">
              <Label htmlFor="anonimizacao" className="font-medium">Anonimização</Label>
              <p className="text-sm text-muted-foreground">
                Substituição dos dados pessoais por identificadores genéricos (ex: usuário_0342).
                Suas ações e histórico permanecerão no sistema, mas sem identificação pessoal.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="exclusao" id="exclusao" />
            <div className="grid gap-1.5">
              <Label htmlFor="exclusao" className="font-medium">Exclusão</Label>
              <p className="text-sm text-muted-foreground">
                Todos os dados pessoais serão deletados, exceto os exigidos por obrigações fiscais/legais.
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </RadioGroup>
        <div className="space-y-2">
          <Label htmlFor="confirmacaoExclusao">Digite "CONFIRMAR" para prosseguir</Label>
          <Input 
            id="confirmacaoExclusao" 
            placeholder="CONFIRMAR" 
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Esta ação não pode ser desfeita. Todos os dados associados serão processados conforme a opção selecionada.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={confirmacao !== "CONFIRMAR"}
        >
          <UserXIcon className="w-4 h-4" />
          Solicitar {tipoExclusao === "anonimizacao" ? "anonimização" : "exclusão"}
        </Button>
      </CardContent>
    </Card>
  );
} 