import * as React from "react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/app/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { updateProfile } from "@/app/actions/profiles/user-profile";

type Theme = "light" | "dark";

export default function PreferenciasInterface() {
    const { userData, updateUserData: updateContextUserData, fetchUserData } = useUser();
    const { toast } = useToast();

    const [idioma, setIdioma] = React.useState("pt-br");
    const [densidade, setDensidade] = React.useState("confortavel");
    const [formatoData, setFormatoData] = React.useState("dd/mm/aaaa");
    const [formatoHora, setFormatoHora] = React.useState("24h");
    const [isUpdatingTheme, setIsUpdatingTheme] = React.useState(false);

    const currentTheme = userData?.theme as Theme || "light";

    const handleThemeChange = async (newTheme: string) => {
        if (!userData) {
            toast({
                title: "Erro",
                description: "Dados do usuário não carregados. Não é possível alterar o tema.",
                variant: "destructive",
            });
            return;
        }

        const themeValue = newTheme as Theme;
        setIsUpdatingTheme(true);

        try {
            const profileToUpdate = { 
                ...userData,
                theme: themeValue 
            };
            const result = await updateProfile(profileToUpdate);

            if (result.error) {
                throw new Error(result.error);
            }

            await fetchUserData(); 

            toast({
                title: "Sucesso",
                description: `Tema alterado para ${themeValue}.`,
            });

        } catch (error: any) {
            toast({
                title: "Erro ao alterar tema",
                description: error.message || "Ocorreu um problema ao tentar salvar o novo tema.",
                variant: "destructive",
            });
        } finally {
            setIsUpdatingTheme(false);
        }
    };

    return (
        <Card className="shadow-none">
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="idioma">Idioma da Interface</Label>
                        <Select value={idioma} onValueChange={setIdioma}>
                            <SelectTrigger id="idioma">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                                <SelectItem value="en">Inglês</SelectItem>
                                <SelectItem value="es">Espanhol</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Escolha o idioma principal para a interface.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tema">Tema</Label>
                        <Select 
                            value={currentTheme} 
                            onValueChange={handleThemeChange}
                            disabled={!userData || isUpdatingTheme}
                        >
                            <SelectTrigger id="tema">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Claro</SelectItem>
                                <SelectItem value="dark">Escuro</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Defina o esquema de cores da interface.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="densidade">Densidade de Exibição</Label>
                        <Select value={densidade} onValueChange={setDensidade}>
                            <SelectTrigger id="densidade">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="confortavel">Confortável (espaçamento maior)</SelectItem>
                                <SelectItem value="compacto">Compacto (mais itens na tela)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Ajuste o espaçamento para visualizar mais ou menos informações.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="formatoData">Formato de Data</Label>
                        <Select value={formatoData} onValueChange={setFormatoData}>
                            <SelectTrigger id="formatoData">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dd/mm/aaaa">DD/MM/AAAA</SelectItem>
                                <SelectItem value="mm/dd/aaaa">MM/DD/AAAA</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Escolha como as datas serão exibidas.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="formatoHora">Formato de Hora</Label>
                        <Select value={formatoHora} onValueChange={setFormatoHora}>
                            <SelectTrigger id="formatoHora">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="24h">24 horas (ex: 14:30)</SelectItem>
                                <SelectItem value="12h">12 horas (ex: 02:30 PM)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Escolha o formato de exibição das horas.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 