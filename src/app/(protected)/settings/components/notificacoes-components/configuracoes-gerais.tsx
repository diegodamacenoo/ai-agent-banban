import React, { useState } from 'react';
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";

// Tipo para o componente TimePickerComponent
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id: string;
  label: string;
}

export function ConfiguracoesGeraisNotificacoes() {
  // Estado para modo "NÃ£o Perturbe"
  const [naoPerturbeModo, setNaoPerturbeModo] = useState(false);
  const [naoPerturbeInicio, setNaoPerturbeInicio] = useState("22:00");
  const [naoPerturbeFim, setNaoPerturbeFim] = useState("08:00");

  // Estado para resumos periÃ³dicos
  const [resumoDiarioHora, setResumoDiarioHora] = useState("18:00");
  const [resumoSemanalDia, setResumoSemanalDia] = useState("sexta");
  const [resumoSemanalHora, setResumoSemanalHora] = useState("16:00");

  // ImplementaÃ§Ã£o simples de campo de hora usando Input
  const TimePickerComponent = ({ value, onChange, id, label }: TimePickerProps) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <Input
          type="time"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full"
        />
      </div>
    );
  };

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-6">
        {/* Modo "NÃ£o Perturbe" */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">Modo "NÃ£o Perturbe"</h4>
              <p className="text-sm text-muted-foreground">Suspenda notificaÃ§Ãµes durante horÃ¡rios especÃ­ficos</p>
            </div>
            <Switch
              id="nao-perturbe-switch"
              checked={naoPerturbeModo}
              onCheckedChange={() => setNaoPerturbeModo(!naoPerturbeModo)}
            />
          </div>

          {naoPerturbeModo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimePickerComponent
                id="nao-perturbe-inicio"
                label="HorÃ¡rio de InÃ­cio"
                value={naoPerturbeInicio}
                onChange={setNaoPerturbeInicio}
              />
              <TimePickerComponent
                id="nao-perturbe-fim"
                label="HorÃ¡rio de TÃ©rmino"
                value={naoPerturbeFim}
                onChange={setNaoPerturbeFim}
              />
              <p className="text-xs text-muted-foreground col-span-2">
                Durante este perÃ­odo, apenas notificaÃ§Ãµes crÃ­ticas serÃ£o entregues imediatamente.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* ConfiguraÃ§Ãµes de Resumo DiÃ¡rio */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Resumo DiÃ¡rio</h4>
            <p className="text-sm text-muted-foreground">ConfiguraÃ§Ãµes para resumos diÃ¡rios de notificaÃ§Ãµes</p>
          </div>

          <div className="space-y-4">
            <TimePickerComponent
              id="resumo-diario-hora"
              label="HorÃ¡rio de Envio"
              value={resumoDiarioHora}
              onChange={setResumoDiarioHora}
            />
            <p className="text-xs text-muted-foreground">
              O resumo diÃ¡rio agruparÃ¡ todas as notificaÃ§Ãµes nÃ£o crÃ­ticas recebidas nas Ãºltimas 24 horas.
            </p>
          </div>
        </div>

        <Separator />

        {/* ConfiguraÃ§Ãµes de Resumo Semanal */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Resumo Semanal</h4>
            <p className="text-sm text-muted-foreground">ConfiguraÃ§Ãµes para resumos semanais de notificaÃ§Ãµes</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resumo-semanal-dia">Dia da Semana</Label>
              <Select 
                value={resumoSemanalDia} 
                onValueChange={setResumoSemanalDia}
              >
                <SelectTrigger id="resumo-semanal-dia">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segunda">Segunda-feira</SelectItem>
                  <SelectItem value="terca">TerÃ§a-feira</SelectItem>
                  <SelectItem value="quarta">Quarta-feira</SelectItem>
                  <SelectItem value="quinta">Quinta-feira</SelectItem>
                  <SelectItem value="sexta">Sexta-feira</SelectItem>
                  <SelectItem value="sabado">SÃ¡bado</SelectItem>
                  <SelectItem value="domingo">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TimePickerComponent
              id="resumo-semanal-hora"
              label="HorÃ¡rio de Envio"
              value={resumoSemanalHora}
              onChange={setResumoSemanalHora}
            />
            
            <p className="text-xs text-muted-foreground">
              O resumo semanal fornecerÃ¡ uma visÃ£o geral das atividades e notificaÃ§Ãµes da semana inteira.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
