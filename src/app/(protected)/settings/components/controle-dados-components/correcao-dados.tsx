import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
          <Label htmlFor="tipoSolicitacao">Tipo de solicitação</Label>
          <Select value={tipoSolicitacao} onValueChange={setTipoSolicitacao}>
            <SelectTrigger id="tipoSolicitacao">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="correcao">Correção de dados cadastrais</SelectItem>
              <SelectItem value="atualizacao">Atualização de informações</SelectItem>
              <SelectItem value="outro">Outro tipo de correção</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="descricaoSolicitacao">Descrição da solicitação</Label>
          <Textarea
            id="descricaoSolicitacao"
            placeholder="Descreva detalhadamente qual informação precisa ser corrigida e qual seria o valor correto"
            value={descricaoSolicitacao}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescricaoSolicitacao(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Sua solicitação será analisada pela equipe administrativa. Caso a alteração seja aprovada,
            você receberá uma notificação.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <EditIcon className="w-4 h-4" />
          Enviar solicitação
        </Button>
      </CardContent>
    </Card>
  );
} 