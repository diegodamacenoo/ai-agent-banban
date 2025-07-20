import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { EditIcon } from "lucide-react";

interface CorrecaoDadosProps {
  tipoSolicitacao: string;
  setTipoSolicitacao: (value: string) => void;
  descricaoSolicitacao: string;
  setDescricaoSolicitacao: (value: string) => void;
}

export function CorrecaoDados({
  tipoSolicitacao,
  setTipoSolicitacao,
  descricaoSolicitacao,
  setDescricaoSolicitacao,
}: CorrecaoDadosProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tipoSolicitacao">Tipo de solicitaÃ§Ã£o</Label>
          <Select value={tipoSolicitacao} onValueChange={setTipoSolicitacao}>
            <SelectTrigger id="tipoSolicitacao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="correcao">CorreÃ§Ã£o de dados cadastrais</SelectItem>
              <SelectItem value="atualizacao">AtualizaÃ§Ã£o de informaÃ§Ãµes</SelectItem>
              <SelectItem value="outro">Outro tipo de correÃ§Ã£o</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricaoSolicitacao">DescriÃ§Ã£o da solicitaÃ§Ã£o</Label>
          <Textarea
            id="descricaoSolicitacao"
            placeholder="Descreva detalhadamente qual informaÃ§Ã£o precisa ser corrigida e qual seria o valor correto"
            value={descricaoSolicitacao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricaoSolicitacao(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Sua solicitaÃ§Ã£o serÃ¡ analisada pela equipe administrativa. Caso a alteraÃ§Ã£o seja aprovada,
            vocÃª receberÃ¡ uma notificaÃ§Ã£o.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <EditIcon className="w-4 h-4" />
          Enviar solicitaÃ§Ã£o
        </Button>
      </CardContent>
    </Card>
  );
} 
