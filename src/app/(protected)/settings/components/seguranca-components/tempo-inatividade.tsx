import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveIcon, InfoIcon, ClockIcon } from "lucide-react";

interface TempoInatividadeProps {
  tempoInatividade: string;
  setTempoInatividade: (value: string) => void;
}

export default function TempoInatividade({
  tempoInatividade,
  setTempoInatividade,
}: TempoInatividadeProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <InfoIcon className="text-blue-500 w-5 h-5" />
          <p className="text-sm text-muted-foreground">
            Por segurança, é recomendado definir um tempo máximo de inatividade para desconectar usuários ociosos automaticamente.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tempoInatividade">Tempo máximo de inatividade</Label>
          <Select value={tempoInatividade} onValueChange={setTempoInatividade}>
            <SelectTrigger id="tempoInatividade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="240">4 horas</SelectItem>
              <SelectItem value="0">Nunca (não recomendado)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {tempoInatividade === "0" ? (
              <span className="text-red-500">Atenção: Não definir um tempo de inatividade pode representar um risco de segurança.</span>
            ) : (
              <span>Após {tempoInatividade} minutos de inatividade, o usuário será desconectado automaticamente.</span>
            )}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-md border">
          <div className="flex items-center gap-2">
            <ClockIcon className="text-amber-500 w-5 h-5" />
            <p className="text-sm">
              O usuário receberá um aviso 2 minutos antes de ser desconectado por inatividade, permitindo que ele estenda a sessão.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
