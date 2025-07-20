import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
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
            Por seguranÃ§a, Ã© recomendado definir um tempo mÃ¡ximo de inatividade para desconectar usuÃ¡rios ociosos automaticamente.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tempoInatividade">Tempo mÃ¡ximo de inatividade</Label>
          <Select value={tempoInatividade} onValueChange={setTempoInatividade}>
            <SelectTrigger id="tempoInatividade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="240">4 horas</SelectItem>
              <SelectItem value="0">Nunca (nÃ£o recomendado)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {tempoInatividade === "0" ? (
              <span className="text-red-500">AtenÃ§Ã£o: NÃ£o definir um tempo de inatividade pode representar um risco de seguranÃ§a.</span>
            ) : (
              <span>ApÃ³s {tempoInatividade} minutos de inatividade, o usuÃ¡rio serÃ¡ desconectado automaticamente.</span>
            )}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-md border">
          <div className="flex items-center gap-2">
            <ClockIcon className="text-amber-500 w-5 h-5" />
            <p className="text-sm">
              O usuÃ¡rio receberÃ¡ um aviso 2 minutos antes de ser desconectado por inatividade, permitindo que ele estenda a sessÃ£o.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
