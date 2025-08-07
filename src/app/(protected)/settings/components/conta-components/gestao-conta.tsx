'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Badge } from "@/shared/ui/badge";
import { useToast } from '@/shared/ui/toast';
import { Trash2Icon, DownloadIcon, ArchiveIcon, ShieldXIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon } from "lucide-react";

// Server Actions imports
import { 
    requestDataExport, 
    deactivateAccount, 
    requestAccountDeletion, 
    cancelAccountDeletion,
    type DataExportFormat 
} from "@/app/actions/auth/account-management";
import { 
    getUserDataExports, 
    getUserDeletionRequest,
    type UserDataExport,
    type DeletionRequest 
} from "@/app/actions/auth/account-status";

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
};

export default function GestaoConta() {
    const router = useRouter();
    const { toast } = useToast();    

    // Estados para desativaÃ§Ã£o
    const [isDeactivating, setIsDeactivating] = React.useState(false);

    // Estados para exclusÃ£o
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [senhaConfirmacao, setSenhaConfirmacao] = React.useState("");
    const [deletionRequest, setDeletionRequest] = React.useState<DeletionRequest | null>(null);
    const [loadingDeletion, setLoadingDeletion] = React.useState(true);

    // Carregar dados ao montar o componente
    React.useEffect(() => {
        loadDeletionRequest();
    }, []);


    const loadDeletionRequest = async () => {
        try {
            setLoadingDeletion(true);
            const result = await getUserDeletionRequest();
            if (result.success) {
                setDeletionRequest(result.data as DeletionRequest | null);
            } else if (result.error) {
                toast.error(result.error, {
                    title: "Erro ao verificar exclusÃ£o",
                });
            }
        } catch (error) {
            toast.error("Erro ao verificar solicitaÃ§Ã£o de exclusÃ£o.", {
                title: "Erro inesperado",
            });
        } finally {
            setLoadingDeletion(false);
        }
    };


    const handleDesativarConta = async () => {
        try {
            setIsDeactivating(true);
            const result = await deactivateAccount();
            
            if (result.success) {
                toast.success('Conta desativada com sucesso. Redirecionando...', {
                    title: "Conta desativada com sucesso",
                });
                // Redirecionar para login apÃ³s alguns segundos
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                toast.error(result.error || 'Erro ao desativar conta.', {
                    title: "Erro ao desativar conta",
                });
            }
        } catch (error) {
            toast.error("Erro inesperado ao desativar conta.", {
                title: "Erro inesperado",
            });
        } finally {
            setIsDeactivating(false);
        }
    };

    const handleExcluirConta = async () => {
        if (!senhaConfirmacao.trim()) {
            toast.error("Por favor, digite sua senha para confirmar.", {
                title: "Senha obrigatÃ³ria",
            });
            return;
        }

        try {
            setIsDeleting(true);
            const result = await requestAccountDeletion(senhaConfirmacao);
            
            if (result.success) {
                toast.success('Um email de confirmaÃ§Ã£o foi enviado. Verifique sua caixa de entrada.', {
                    title: "SolicitaÃ§Ã£o de exclusÃ£o enviada",
                });
                setSenhaConfirmacao("");
                await loadDeletionRequest(); // Recarregar status
            } else {
                toast.error(result.error || 'Erro ao solicitar exclusÃ£o.', {
                    title: "Erro ao solicitar exclusÃ£o",
                });
            }
        } catch (error) {
            toast.error("Erro inesperado ao solicitar exclusÃ£o.", {
                title: "Erro inesperado",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelarExclusao = async () => {
        try {
            const result = await cancelAccountDeletion();
            
            if (result.success) {
                toast.success('SolicitaÃ§Ã£o de exclusÃ£o cancelada com sucesso.', {
                    title: "ExclusÃ£o cancelada",
                });
                await loadDeletionRequest(); // Recarregar status
            } else {
                toast.error(result.error || 'Erro ao cancelar exclusÃ£o.', {
                    title: "Erro ao cancelar exclusÃ£o",
                });
            }
        } catch (error) {
            toast.error("Erro inesperado ao cancelar exclusÃ£o.", {
                title: "Erro inesperado",
            });
        }
    };

    return (
        <Card className="shadow-none">
            <CardContent className="p-6 space-y-4">

                {/* Desativar Conta Temporariamente */}
                <div className="flex items-center justify-between p-3 border rounded-md bg-background gap-2">
                    <div>
                        <h4 className="font-medium">Desativar Conta Temporariamente</h4>
                        <p className="text-xs text-muted-foreground">
                            Congele seu acesso e pause atividades, preservando seus dados para reativaÃ§Ã£o futura.
                        </p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2" disabled={!!deletionRequest}>
                                <ArchiveIcon className="w-4 h-4" /> Desativar Conta
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Desativar Conta Temporariamente?</DialogTitle>
                                <DialogDescription>
                                    Sua conta serÃ¡ congelada e vocÃª perderÃ¡ o acesso temporariamente. Todas as suas configuraÃ§Ãµes e histÃ³rico de aÃ§Ãµes serÃ£o preservados.
                                    VocÃª poderÃ¡ reativar sua conta a qualquer momento fazendo login novamente. Deseja continuar?
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline">Cancelar</Button variant="outline">
                                <Button onClick={handleDesativarConta} disabled={isDeactivating}>
                                    {isDeactivating ? 'Desativando...' : 'Sim, Desativar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                
                <Separator className="my-6"/>

                {/* Status da SolicitaÃ§Ã£o de ExclusÃ£o */}
                {!loadingDeletion && deletionRequest && (
                    <div className="p-4 border border-orange-200 rounded-md bg-orange-50">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h4 className="font-medium text-orange-800 flex items-center gap-1.5">
                                    <ClockIcon className="w-5 h-5"/> 
                                    SolicitaÃ§Ã£o de ExclusÃ£o {deletionRequest.status === 'pending' ? 'Pendente' : 'Confirmada'}
                                </h4>
                                <p className="text-sm text-orange-700 mt-1">
                                    {deletionRequest.status === 'pending' && 'Verifique seu email para confirmar a exclusÃ£o.'}
                                    {deletionRequest.status === 'confirmed' && deletionRequest.scheduled_deletion_date && 
                                        `Sua conta serÃ¡ excluÃ­da em ${formatDate(deletionRequest.scheduled_deletion_date)}.`
                                    }
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCancelarExclusao}
                                className="text-orange-800 border-orange-300 hover:bg-orange-100"
                            >
                                Cancelar ExclusÃ£o
                            </Button>
                        </div>
                    </div>
                )}

                {/* Excluir Conta */}
                {!deletionRequest && (
                    <div className="p-4 border border-destructive/50 rounded-md bg-destructive/5">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h4 className="font-medium text-destructive flex items-center gap-1.5">
                                    <ShieldXIcon className="w-5 h-5"/> Excluir Minha Conta Permanentemente
                                </h4>
                                <p className="text-xs text-destructive/80 mt-1">
                                    Esta aÃ§Ã£o iniciarÃ¡ um processo irreversÃ­vel que removerÃ¡ todas as suas configuraÃ§Ãµes e dados apÃ³s 7 dias.
                                </p>
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="gap-2">
                                        <Trash2Icon className="w-4 h-4" /> Excluir Conta
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>VocÃª tem CERTEZA?</DialogTitle>
                                        <DialogDescription className="space-y-3">
                                            <p>A exclusÃ£o da sua conta Ã© uma aÃ§Ã£o <strong>permanente e irreversÃ­vel</strong>.</p>
                                            <p>Todos os seus dados pessoais, configuraÃ§Ãµes, histÃ³rico de atividades e qualquer conteÃºdo associado Ã  sua conta serÃ£o excluÃ­dos apÃ³s um perÃ­odo de carÃªncia de 7 dias. ApÃ³s a exclusÃ£o, nÃ£o serÃ¡ possÃ­vel recuperar sua conta ou seus dados.</p>
                                            <p>Para prosseguir, digite sua senha atual e confirme. Um email de verificaÃ§Ã£o serÃ¡ enviado para finalizar o processo.</p>
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2 py-2">
                                        <Label htmlFor="senha-confirmacao-excluir" className="text-sm font-medium">
                                            Digite sua senha para confirmar:
                                        </Label>
                                        <Input 
                                            id="senha-confirmacao-excluir" 
                                            type="password" 
                                            placeholder="Sua senha atual"
                                            value={senhaConfirmacao}
                                            onChange={(e) => setSenhaConfirmacao(e.target.value)}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setSenhaConfirmacao("")}>Cancelar</Button variant="outline">
                                        <Button 
                                            onClick={handleExcluirConta} 
                                            disabled={!senhaConfirmacao.trim() || isDeleting} 
                                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                        >
                                            {isDeleting ? 'Processando...' : 'Confirmar ExclusÃ£o'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 
