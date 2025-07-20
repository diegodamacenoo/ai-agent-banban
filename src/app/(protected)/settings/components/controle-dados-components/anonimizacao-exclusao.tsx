import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
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
            AtenÃ§Ã£o: A exclusÃ£o serÃ¡ irreversÃ­vel e pode impactar histÃ³ricos associados
            (ex: quem criou um alerta ou nota manual).
          </p>
        </div>
        <RadioGroup value={tipoExclusao} onValueChange={setTipoExclusao} className="space-y-3">
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="anonimizacao" id="anonimizacao" />
            <div className="grid gap-1.5">
              <Label htmlFor="anonimizacao" className="font-medium">AnonimizaÃ§Ã£o</Label>
              <p className="text-sm text-muted-foreground">
                SubstituiÃ§Ã£o dos dados pessoais por identificadores genÃ©ricos (ex: usuÃ¡rio_0342).
                Suas aÃ§Ãµes e histÃ³rico permanecerÃ£o no sistema, mas sem identificaÃ§Ã£o pessoal.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="exclusao" id="exclusao" />
            <div className="grid gap-1.5">
              <Label htmlFor="exclusao" className="font-medium">ExclusÃ£o</Label>
              <p className="text-sm text-muted-foreground">
                Todos os dados pessoais serÃ£o deletados, exceto os exigidos por obrigaÃ§Ãµes fiscais/legais.
                Esta aÃ§Ã£o nÃ£o pode ser desfeita.
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
            Esta aÃ§Ã£o nÃ£o pode ser desfeita. Todos os dados associados serÃ£o processados conforme a opÃ§Ã£o selecionada.
          </p>
        </div>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={confirmacao !== "CONFIRMAR"}
        >
          <UserXIcon className="w-4 h-4" />
          Solicitar {tipoExclusao === "anonimizacao" ? "anonimizaÃ§Ã£o" : "exclusÃ£o"}
        </Button>
      </CardContent>
    </Card>
  );
} 
