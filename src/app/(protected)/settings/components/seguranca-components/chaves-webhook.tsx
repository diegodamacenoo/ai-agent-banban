import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SaveIcon, InfoIcon, CopyIcon, RefreshCwIcon, SendIcon, AlertTriangleIcon } from "lucide-react";

interface ChavesWebhookProps {
  chaveWebhook: string;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  ultimoUsoWebhook: string;
  gerarNovaChaveWebhook: () => void;
  testarWebhook: () => void;
  copyToClipboard: (value: string) => void;
}

export default function ChavesWebhook({
  chaveWebhook,
  webhookUrl,
  setWebhookUrl,
  ultimoUsoWebhook,
  gerarNovaChaveWebhook,
  testarWebhook,
  copyToClipboard,
}: ChavesWebhookProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <InfoIcon className="text-blue-500 w-5 h-5" />
          <p className="text-sm text-muted-foreground">
            Webhooks permitem que o ERP da BanBan envie notificações automáticas para esta plataforma quando eventos ocorrem.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">URL do webhook de entrada</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="webhookUrl" 
              placeholder="https://" 
              value={webhookUrl} 
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="flex-grow" 
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => copyToClipboard(webhookUrl)} 
              title="Copiar URL"
            >
              <CopyIcon className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Utilize esta URL para integrar eventos do seu ERP.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="chaveWebhook">Chave secreta de webhook</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="chaveWebhook" 
              type="password" 
              value={chaveWebhook} 
              readOnly 
              className="font-mono" 
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => copyToClipboard(chaveWebhook)} 
              title="Copiar chave"
            >
              <CopyIcon className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta chave deve ser configurada no ERP para validar as solicitações enviadas.
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Última utilização: <span className="font-medium">{ultimoUsoWebhook}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={gerarNovaChaveWebhook} className="gap-2">
              <RefreshCwIcon className="w-4 h-4" />
              Gerar nova chave
            </Button>
            <Button variant="outline" onClick={testarWebhook} className="gap-2">
              <SendIcon className="w-4 h-4" />
              Testar webhook
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-md border">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="text-amber-500 w-5 h-5" />
            <p className="text-sm">
              Atenção: Gerar uma nova chave invalidará a anterior e exigirá reconfiguração no ERP.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
