'use client';

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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

    // Estados para desativação
    const [isDeactivating, setIsDeactivating] = React.useState(false);

    // Estados para exclusão
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
                toast({
                    variant: "destructive",
                    title: "Erro ao verificar exclusão",
                    description: result.error,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Erro ao verificar solicitação de exclusão.",
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
                toast({
                    title: "Conta desativada com sucesso",
                    description: result.data?.message || 'Conta desativada com sucesso. Redirecionando...',
                });
                // Redirecionar para login após alguns segundos
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro ao desativar conta",
                    description: result.error || 'Erro ao desativar conta.',
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Erro inesperado ao desativar conta.",
            });
        } finally {
            setIsDeactivating(false);
        }
    };

    const handleExcluirConta = async () => {
        if (!senhaConfirmacao.trim()) {
            toast({
                variant: "destructive",
                title: "Senha obrigatória",
                description: "Por favor, digite sua senha para confirmar.",
            });
            return;
        }

        try {
            setIsDeleting(true);
            const result = await requestAccountDeletion(senhaConfirmacao);
            
            if (result.success) {
                toast({
                    title: "Solicitação de exclusão enviada",
                    description: result.data?.message || 'Um email de confirmação foi enviado. Verifique sua caixa de entrada.',
                });
                setSenhaConfirmacao("");
                await loadDeletionRequest(); // Recarregar status
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro ao solicitar exclusão",
                    description: result.error || 'Erro ao solicitar exclusão.',
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Erro inesperado ao solicitar exclusão.",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelarExclusao = async () => {
        try {
            const result = await cancelAccountDeletion();
            
            if (result.success) {
                toast({
                    title: "Exclusão cancelada",
                    description: result.data?.message || 'Solicitação de exclusão cancelada com sucesso.',
                });
                await loadDeletionRequest(); // Recarregar status
            } else {
                toast({
                    variant: "destructive",
                    title: "Erro ao cancelar exclusão",
                    description: result.error || 'Erro ao cancelar exclusão.',
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Erro inesperado ao cancelar exclusão.",
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
                            Congele seu acesso e pause atividades, preservando seus dados para reativação futura.
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2" disabled={!!deletionRequest}>
                                <ArchiveIcon className="w-4 h-4" /> Desativar Conta
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Desativar Conta Temporariamente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Sua conta será congelada e você perderá o acesso temporariamente. Todas as suas configurações e histórico de ações serão preservados.
                                    Você poderá reativar sua conta a qualquer momento fazendo login novamente. Deseja continuar?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDesativarConta} disabled={isDeactivating}>
                                    {isDeactivating ? 'Desativando...' : 'Sim, Desativar'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                
                <Separator className="my-6"/>

                {/* Status da Solicitação de Exclusão */}
                {!loadingDeletion && deletionRequest && (
                    <div className="p-4 border border-orange-200 rounded-md bg-orange-50">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <h4 className="font-medium text-orange-800 flex items-center gap-1.5">
                                    <ClockIcon className="w-5 h-5"/> 
                                    Solicitação de Exclusão {deletionRequest.status === 'pending' ? 'Pendente' : 'Confirmada'}
                                </h4>
                                <p className="text-sm text-orange-700 mt-1">
                                    {deletionRequest.status === 'pending' && 'Verifique seu email para confirmar a exclusão.'}
                                    {deletionRequest.status === 'confirmed' && deletionRequest.scheduled_deletion_date && 
                                        `Sua conta será excluída em ${formatDate(deletionRequest.scheduled_deletion_date)}.`
                                    }
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCancelarExclusao}
                                className="text-orange-800 border-orange-300 hover:bg-orange-100"
                            >
                                Cancelar Exclusão
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
                                    Esta ação iniciará um processo irreversível que removerá todas as suas configurações e dados após 7 dias.
                                </p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" className="gap-2">
                                        <Trash2Icon className="w-4 h-4" /> Excluir Conta
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem CERTEZA?</AlertDialogTitle>
                                        <AlertDialogDescription className="space-y-3">
                                            <p>A exclusão da sua conta é uma ação <strong>permanente e irreversível</strong>.</p>
                                            <p>Todos os seus dados pessoais, configurações, histórico de atividades e qualquer conteúdo associado à sua conta serão excluídos após um período de carência de 7 dias. Após a exclusão, não será possível recuperar sua conta ou seus dados.</p>
                                            <p>Para prosseguir, digite sua senha atual e confirme. Um email de verificação será enviado para finalizar o processo.</p>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
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
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setSenhaConfirmacao("")}>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={handleExcluirConta} 
                                            disabled={!senhaConfirmacao.trim() || isDeleting} 
                                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                        >
                                            {isDeleting ? 'Processando...' : 'Confirmar Exclusão'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 