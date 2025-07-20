import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Separator } from "@/shared/ui/separator";
import { SaveIcon, InfoIcon, LockIcon, ShieldIcon } from "lucide-react";

interface AutenticacaoDoisFatoresProps {
  ativar2FA: boolean;
  setAtivar2FA: (value: boolean) => void;
  obrigatorio2FA: boolean;
  setObrigatorio2FA: (value: boolean) => void;
  metodo2FA: string;
  setMetodo2FA: (value: string) => void;
}

export default function AutenticacaoDoisFatores({
  ativar2FA,
  setAtivar2FA,
  obrigatorio2FA,
  setObrigatorio2FA,
  metodo2FA,
  setMetodo2FA,
}: AutenticacaoDoisFatoresProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ativar2FA">Ativar autenticaÃ§Ã£o em dois fatores para sua conta</Label>
            <p className="text-xs text-muted-foreground">Habilita o uso de 2FA em sua conta</p>
          </div>
          <Switch id="ativar2FA" checked={ativar2FA} onCheckedChange={setAtivar2FA} />
        </div>
        
        {ativar2FA && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="obrigatorio2FA">Tornar 2FA obrigatÃ³rio para todos os usuÃ¡rios</Label>
                <p className="text-xs text-muted-foreground">Se ativado, todos os usuÃ¡rios serÃ£o obrigados a configurar o 2FA em suas contas</p>
              </div>
              <Switch id="obrigatorio2FA" checked={obrigatorio2FA} onCheckedChange={setObrigatorio2FA} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="metodo2FA">MÃ©todos de autenticaÃ§Ã£o permitidos</Label>
              <RadioGroup value={metodo2FA} onValueChange={setMetodo2FA} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="app" id="app" />
                  <Label htmlFor="app" className="font-normal">Apenas aplicativo autenticador (mais seguro)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="font-normal">Apenas cÃ³digo por e-mail</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ambos" id="ambos" />
                  <Label htmlFor="ambos" className="font-normal">Permitir que usuÃ¡rios escolham o mÃ©todo</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                O aplicativo autenticador Ã© mais seguro pois nÃ£o depende do acesso ao e-mail.
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>PolÃ­tica de recuperaÃ§Ã£o de acesso</Label>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md border">
                <p className="text-sm">Quando um usuÃ¡rio perder acesso ao 2FA:</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-5">
                  <li>Apenas administradores podem resetar o 2FA para usuÃ¡rios</li>
                  <li>O usuÃ¡rio precisarÃ¡ configurar o 2FA novamente em atÃ© 24 horas</li>
                  <li>Todas as sessÃµes ativas do usuÃ¡rio serÃ£o encerradas</li>
                  <li>Uma notificaÃ§Ã£o serÃ¡ enviada aos administradores</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button variant="outline" className="gap-2">
                <SaveIcon className="w-4 h-4" />
                Salvar PolÃ­tica Organizacional
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
