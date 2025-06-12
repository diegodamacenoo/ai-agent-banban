import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { SaveIcon, InfoIcon, EyeIcon, EyeOffIcon, CheckIcon, XIcon } from "lucide-react";

interface PoliticaSenhaProps {
  comprimentoMinimo: number;
  setComprimentoMinimo: (value: number) => void;
  forcaSenha: string;
  setForcaSenha: (value: string) => void;
  bloqueioTentativas: number;
  setBloqueioTentativas: (value: number) => void;
  validadeSenha: number;
  setValidadeSenha: (value: number) => void;
  senhaExemplo: string;
  mostrarSenha: boolean;
  setMostrarSenha: (value: boolean) => void;
}

export default function PoliticaSenha({
  comprimentoMinimo,
  setComprimentoMinimo,
  forcaSenha,
  setForcaSenha,
  bloqueioTentativas,
  setBloqueioTentativas,
  validadeSenha,
  setValidadeSenha,
  senhaExemplo,
  mostrarSenha,
  setMostrarSenha,
}: PoliticaSenhaProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <InfoIcon className="text-blue-500 w-5 h-5" />
          <p className="text-sm text-muted-foreground">
            Uma política de senha forte é essencial para proteger o acesso à sua conta e dados sensíveis.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="comprimentoMinimo">Comprimento mínimo: {comprimentoMinimo} caracteres</Label>
          <Slider
            id="comprimentoMinimo"
            min={6}
            max={16}
            step={1}
            value={[comprimentoMinimo]}
            onValueChange={(value) => setComprimentoMinimo(value[0])}
          />
          <p className="text-xs text-muted-foreground">Recomendamos no mínimo 8 caracteres para uma segurança adequada.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="forcaSenha">Força da senha</Label>
          <Select value={forcaSenha} onValueChange={setForcaSenha}>
            <SelectTrigger id="forcaSenha">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fraca">Básica (letras minúsculas e números)</SelectItem>
              <SelectItem value="media">Média (letras maiúsculas, minúsculas e números)</SelectItem>
              <SelectItem value="forte">Forte (maiúsculas, minúsculas, números e caracteres especiais)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Senhas mais fortes incluem combinações de letras maiúsculas, minúsculas, números e caracteres especiais.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bloqueioTentativas">Bloqueio após tentativas falhas</Label>
          <Select value={bloqueioTentativas.toString()} onValueChange={(value) => setBloqueioTentativas(parseInt(value))}>
            <SelectTrigger id="bloqueioTentativas">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 tentativas</SelectItem>
              <SelectItem value="5">5 tentativas</SelectItem>
              <SelectItem value="10">10 tentativas</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Após o número definido de tentativas falhas, a conta será temporariamente bloqueada por 30 minutos.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="validadeSenha">Validade da senha</Label>
          <Select value={validadeSenha.toString()} onValueChange={(value) => setValidadeSenha(parseInt(value))}>
            <SelectTrigger id="validadeSenha">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="60">60 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="180">180 dias</SelectItem>
              <SelectItem value="0">Nunca expira</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Definir um período de validade para senhas ajuda a manter a segurança da conta.
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label>Prévia da política de senha</Label>
          <div className="bg-white p-4 rounded-md border">
            <p className="text-sm mb-2">Com estas configurações, uma senha válida seria:</p>
            <div className="flex items-center gap-2">
              <code className="bg-gray-100 p-2 rounded flex-1 font-mono">
                {mostrarSenha ? senhaExemplo : senhaExemplo.replace(/./g, '•')}
              </code>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMostrarSenha(!mostrarSenha)}
                title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </Button>
            </div>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              <li className="flex items-center gap-1">
                {comprimentoMinimo >= 8 ? 
                  <CheckIcon className="w-3 h-3 text-green-500" /> : 
                  <XIcon className="w-3 h-3 text-red-500" />} 
                Mínimo de {comprimentoMinimo} caracteres
              </li>
              <li className="flex items-center gap-1">
                {/[A-Z]/.test(senhaExemplo) ? 
                  <CheckIcon className="w-3 h-3 text-green-500" /> : 
                  <XIcon className="w-3 h-3 text-red-500" />} 
                Letras maiúsculas
              </li>
              <li className="flex items-center gap-1">
                {/[a-z]/.test(senhaExemplo) ? 
                  <CheckIcon className="w-3 h-3 text-green-500" /> : 
                  <XIcon className="w-3 h-3 text-red-500" />} 
                Letras minúsculas
              </li>
              <li className="flex items-center gap-1">
                {/[0-9]/.test(senhaExemplo) ? 
                  <CheckIcon className="w-3 h-3 text-green-500" /> : 
                  <XIcon className="w-3 h-3 text-red-500" />} 
                Números
              </li>
              <li className="flex items-center gap-1">
                {/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>/?\\~`]/.test(senhaExemplo) ? 
                  <CheckIcon className="w-3 h-3 text-green-500" /> : 
                  <XIcon className="w-3 h-3 text-red-500" />} 
                Caracteres especiais
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
