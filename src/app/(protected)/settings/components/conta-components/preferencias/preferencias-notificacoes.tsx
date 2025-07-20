import * as React from "react";
import {
    Card,
    CardContent,
} from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import { Checkbox } from "@/shared/ui/checkbox";
import { Input } from "@/shared/ui/input";
import { MailIcon, MessageSquareIcon, SmartphoneIcon, MoonIcon } from "lucide-react";

export default function PreferenciasNotificacoes() {
    // TODO: Adicionar estados e lÃ³gica
    const [canalPreferido, setCanalPreferido] = React.useState("email");
    const [alertasProduto, setAlertasProduto] = React.useState(true);
    const [alertasSeguranca, setAlertasSeguranca] = React.useState(true);
    const [alertasConvites, setAlertasConvites] = React.useState(true);
    const [naoPerturbe, setNaoPerturbe] = React.useState(false);
    const [horaInicioNaoPerturbe, setHoraInicioNaoPerturbe] = React.useState("22:00");
    const [horaFimNaoPerturbe, setHoraFimNaoPerturbe] = React.useState("07:00");

    return (
        <Card className="shadow-none">
            <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="canalPreferido">Canal Preferido para NotificaÃ§Ãµes</Label>
                    <Select value={canalPreferido} onValueChange={setCanalPreferido}>
                        <SelectTrigger id="canalPreferido">
                            <SelectValue placeholder="Selecione um canal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="email">
                                <div className="flex items-center gap-2"><MailIcon className="w-4 h-4" /> E-mail</div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                                <div className="flex items-center gap-2"><MessageSquareIcon className="w-4 h-4" /> WhatsApp</div>
                            </SelectItem>
                            <SelectItem value="sms">
                                <div className="flex items-center gap-2"><SmartphoneIcon className="w-4 h-4" /> SMS</div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Selecione o meio principal pelo qual vocÃª gostaria de ser notificado.
                    </p>
                </div>

                <div className="space-y-3">
                    <Label>Tipos de Alerta</Label>
                    <p className="text-xs text-muted-foreground pb-1">
                        Escolha quais tipos de notificaÃ§Ãµes vocÃª deseja receber.
                    </p>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="alertas-produto" checked={alertasProduto} onCheckedChange={(checked) => setAlertasProduto(Boolean(checked))} />
                        <label
                            htmlFor="alertas-produto"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Novidades e atualizaÃ§Ãµes de produtos
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="alertas-seguranca" checked={alertasSeguranca} onCheckedChange={(checked) => setAlertasSeguranca(Boolean(checked))} />
                        <label
                            htmlFor="alertas-seguranca"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Alertas importantes de seguranÃ§a da conta
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="alertas-convites" checked={alertasConvites} onCheckedChange={(checked) => setAlertasConvites(Boolean(checked))} />
                        <label
                            htmlFor="alertas-convites"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Convites para projetos ou equipes
                        </label>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="nao-perturbe" className="flex items-center gap-1.5">
                           <MoonIcon className="w-4 h-4" /> Modo "NÃ£o Perturbe"
                        </Label>
                        <Switch
                            id="nao-perturbe"
                            checked={naoPerturbe}
                            onCheckedChange={setNaoPerturbe}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Defina um intervalo diÃ¡rio para nÃ£o receber notificaÃ§Ãµes.
                    </p>
                    {naoPerturbe && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="hora-inicio-np">InÃ­cio</Label>
                                <Input id="hora-inicio-np" type="time" value={horaInicioNaoPerturbe} onChange={(e) => setHoraInicioNaoPerturbe(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="hora-fim-np">Fim</Label>
                                <Input id="hora-fim-np" type="time" value={horaFimNaoPerturbe} onChange={(e) => setHoraFimNaoPerturbe(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 
