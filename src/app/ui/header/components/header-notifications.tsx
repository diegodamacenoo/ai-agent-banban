import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BellIcon } from "lucide-react";

export function HeaderNotifications() {
    // TODO: Implementar lógica de fetch e listagem de notificações reais
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {/* TODO: Adicionar indicador de notificações não lidas */}
                    {/* <span className="absolute top-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span> */}
                    <BellIcon className="h-5 w-5" />
                    <span className="sr-only">Notificações</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Notificações</h4>
                        {/* <p className="text-sm text-muted-foreground">
                            Você não tem novas notificações.
                        </p> */}
                    </div>
                    
                    <div className="grid gap-2">
                        <div className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                            <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    Nova venda realizada!
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Pedido #12345 foi confirmado.
                                </p>
                            </div>
                        </div>
                         </div>
                     
                </div>
            </PopoverContent>
        </Popover>
    );
} 