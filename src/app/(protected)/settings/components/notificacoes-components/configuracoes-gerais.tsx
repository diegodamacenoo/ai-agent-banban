import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Tipo para o componente TimePickerComponent
interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  id: string;
  label: string;
}

export function ConfiguracoesGeraisNotificacoes() {
  // Estado para modo "Não Perturbe"
  const [naoPerturbeModo, setNaoPerturbeModo] = useState(false);
  const [naoPerturbeInicio, setNaoPerturbeInicio] = useState("22:00");
  const [naoPerturbeFim, setNaoPerturbeFim] = useState("08:00");

  // Estado para resumos periódicos
  const [resumoDiarioHora, setResumoDiarioHora] = useState("18:00");
  const [resumoSemanalDia, setResumoSemanalDia] = useState("sexta");
  const [resumoSemanalHora, setResumoSemanalHora] = useState("16:00");

  // Implementação simples de campo de hora usando Input
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
        {/* Modo "Não Perturbe" */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">Modo "Não Perturbe"</h4>
              <p className="text-sm text-muted-foreground">Suspenda notificações durante horários específicos</p>
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
                label="Horário de Início"
                value={naoPerturbeInicio}
                onChange={setNaoPerturbeInicio}
              />
              <TimePickerComponent
                id="nao-perturbe-fim"
                label="Horário de Término"
                value={naoPerturbeFim}
                onChange={setNaoPerturbeFim}
              />
              <p className="text-xs text-muted-foreground col-span-2">
                Durante este período, apenas notificações críticas serão entregues imediatamente.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Configurações de Resumo Diário */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Resumo Diário</h4>
            <p className="text-sm text-muted-foreground">Configurações para resumos diários de notificações</p>
          </div>

          <div className="space-y-4">
            <TimePickerComponent
              id="resumo-diario-hora"
              label="Horário de Envio"
              value={resumoDiarioHora}
              onChange={setResumoDiarioHora}
            />
            <p className="text-xs text-muted-foreground">
              O resumo diário agrupará todas as notificações não críticas recebidas nas últimas 24 horas.
            </p>
          </div>
        </div>

        <Separator />

        {/* Configurações de Resumo Semanal */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Resumo Semanal</h4>
            <p className="text-sm text-muted-foreground">Configurações para resumos semanais de notificações</p>
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
                  <SelectItem value="terca">Terça-feira</SelectItem>
                  <SelectItem value="quarta">Quarta-feira</SelectItem>
                  <SelectItem value="quinta">Quinta-feira</SelectItem>
                  <SelectItem value="sexta">Sexta-feira</SelectItem>
                  <SelectItem value="sabado">Sábado</SelectItem>
                  <SelectItem value="domingo">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TimePickerComponent
              id="resumo-semanal-hora"
              label="Horário de Envio"
              value={resumoSemanalHora}
              onChange={setResumoSemanalHora}
            />
            
            <p className="text-xs text-muted-foreground">
              O resumo semanal fornecerá uma visão geral das atividades e notificações da semana inteira.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 