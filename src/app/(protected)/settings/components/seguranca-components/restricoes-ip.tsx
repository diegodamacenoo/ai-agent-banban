import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { TrashIcon, PlusIcon, GlobeIcon, InfoIcon } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

interface RestricoesIPProps {
  restricaoIP: boolean;
  setRestricaoIP: (value: boolean) => void;
  novoIP: string;
  setNovoIP: (value: string) => void;
  listaIPs: string[];
  adicionarIP: () => void;
  removerIP: (ip: string) => void;
}

export default function RestricoesIP({
  restricaoIP,
  setRestricaoIP,
  novoIP,
  setNovoIP,
  listaIPs,
  adicionarIP,
  removerIP,
}: RestricoesIPProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <InfoIcon className="text-blue-500 w-5 h-5" />
          <p className="text-sm text-muted-foreground">
            Restrinja o acesso ao sistema apenas a determinados IPs ou faixas de rede. Use notau00e7u00e3o CIDR para faixas de IP (ex: 192.168.1.0/24).
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="restricaoIP">Ativar restriu00e7u00e3o por IP</Label>
            <p className="text-xs text-muted-foreground">Limita o acesso apenas aos IPs/redes definidos abaixo</p>
          </div>
          <Switch id="restricaoIP" checked={restricaoIP} onCheckedChange={setRestricaoIP} />
        </div>
        
        {restricaoIP && (
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="novoIP">Adicionar IP ou faixa de rede (CIDR)</Label>
                <Input
                  id="novoIP"
                  placeholder="ex: 192.168.1.10 ou 192.168.1.0/24"
                  value={novoIP}
                  onChange={e => setNovoIP(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="gap-2 h-10 w-full"
                  onClick={adicionarIP}
                  disabled={!novoIP}
                >
                  <PlusIcon className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>IPs/Redes Permitidos</Label>
              <div className="flex flex-wrap gap-2">
                {listaIPs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum IP adicionado. Adicione IPs permitidos acima.</p>
                ) : (
                  listaIPs.map(ip => (
                    <Badge key={ip} variant="outline" className="flex items-center gap-1 bg-muted hover:bg-muted py-1.5 px-2">
                      <GlobeIcon className="w-3.5 h-3.5" />
                      {ip}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removerIP(ip)}
                      >
                        <TrashIcon className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </Badge>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Se nenhum IP for adicionado e a restriu00e7u00e3o estiver ativa, ningu00e9m poderu00e1 acessar o sistema.
              </p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <div className="flex items-start gap-2">
                <InfoIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p>Certifique-se de incluir seu IP atual ou perderÃ¡ acesso ao sistema.</p>
                  <p className="font-medium">Seu IP atual: <span className="font-mono">192.168.1.10</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
