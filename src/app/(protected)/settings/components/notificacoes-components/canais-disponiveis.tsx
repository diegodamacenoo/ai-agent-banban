import React, { useState } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Mock de dados/estado inicial - isso viria de props ou de um hook de estado global
const initialCanaisState = {
  email: {
    enabled: true,
    address: "usuario@exemplo.com",
    isMandatory: false,
  },
  whatsapp_sms: {
    enabled: false,
    phoneNumber: "",
    isMandatory: false,
  },
  push_webhook: {
    enabled: true,
    url: "https://api.exemplo.com/webhook/123",
    isMandatory: true, // Exemplo de canal obrigatório pelo Admin
  },
};

export function CanaisDisponiveis() {
  const [canais, setCanais] = useState(initialCanaisState);

  const handleSwitchChange = (canal: keyof typeof initialCanaisState) => {
    setCanais((prev) => ({
      ...prev,
      [canal]: { ...prev[canal], enabled: !prev[canal].enabled },
    }));
  };

  const handleInputChange = (canal: keyof typeof initialCanaisState, field: string, value: string) => {
    setCanais((prev) => ({
      ...prev,
      [canal]: { ...prev[canal], [field]: value },
    }));
  };

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-6">
        {/* Canal E-mail */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">E-mail</h4>
              <p className="text-sm text-muted-foreground">Receba notificações via e-mail</p>
            </div>
            <Switch
              id="email-switch"
              checked={canais.email.enabled}
              onCheckedChange={() => handleSwitchChange("email")}
              disabled={canais.email.isMandatory}
            />
          </div>
        </div>

        <Separator />

        {/* Canal WhatsApp/SMS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-medium">WhatsApp / SMS</h4>
              <p className="text-sm text-muted-foreground">Receba notificações via mensagem de texto</p>
            </div>
            <Switch
              id="whatsapp-sms-switch"
              checked={canais.whatsapp_sms.enabled}
              onCheckedChange={() => handleSwitchChange("whatsapp_sms")}
              disabled={canais.whatsapp_sms.isMandatory}
            />
          </div>
          
          {canais.whatsapp_sms.isMandatory && (
            <p className="text-xs text-amber-600">
              Este canal é obrigatório e não pode ser desabilitado.
            </p>
          )}

          {canais.whatsapp_sms.enabled && (
            <div className="pl-0 space-y-2">
              <Label htmlFor="whatsapp-sms-phone">Número de Telefone (com código do país)</Label>
              <Input
                id="whatsapp-sms-phone"
                type="tel"
                placeholder="+55 (XX) XXXXX-XXXX"
                value={canais.whatsapp_sms.phoneNumber}
                onChange={(e) => handleInputChange("whatsapp_sms", "phoneNumber", e.target.value)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 