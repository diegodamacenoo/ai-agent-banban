'use client';

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { KeyRoundIcon, MailWarningIcon, EyeIcon, EyeOffIcon, CheckIcon, XIcon, DotIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/app/contexts/UserContext";
import { SkeletonForm } from "@/components/ui/skeleton-loader";
import { ErrorCardContainer } from "@/app/ui/utils/error-card-container";

export default function Credenciais() {
    // Contexto de usuário
    const { userData } = useUser();
    // Toast
    const { toast } = useToast();
    
    // Log para depuração
    // console.log('DEBUG - Credenciais userData:', userData);
    
    // Estados para a senha atual, nova senha, confirmação da nova senha, mostrar senha e envio
    const [senhaAtual, setSenhaAtual] = React.useState("");
    const [novaSenha, setNovaSenha] = React.useState("");
    const [confirmarSenha, setConfirmarSenha] = React.useState("");
    const [mostrarSenha, setMostrarSenha] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [isRequesting, setIsRequesting] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    // Função para enviar o formulário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) {
            toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        let submissionError: string | null = null;
        let submissionSuccess: boolean = false;

        try {
            // Chama a API Route para alterar senha
            const result = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: senhaAtual,
                    newPassword: novaSenha,
                    confirmNewPassword: confirmarSenha,
                }),
            });

            const data = await result.json();

            if (result.ok && data.success) {
                submissionSuccess = true;
                setSenhaAtual("");
                setNovaSenha("");
                setConfirmarSenha("");
            } else {
                submissionError = data.error || "Ocorreu um erro desconhecido ao alterar a senha.";
            }
        } catch (error: any) {
            submissionError = error.message || "Falha crítica ao tentar alterar a senha.";
        } finally {
            setIsSubmitting(false);
            if (submissionSuccess) {
                toast({ title: "Senha alterada com sucesso!" });
            } else if (submissionError) {
                toast({ title: "Erro ao alterar senha", description: submissionError, variant: "destructive" });
            }
        }
    };

    // Função para solicitar redefinição de senha
    const handleRequestReset = async () => {
        if (!userData) {
            toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
            return;
        }
        setIsRequesting(true);
        let requestError: string | null = null;
        let requestSuccess: boolean = false;
        try {
            // Chamar API Route para solicitar reset de senha (a ser implementada)
            // Por enquanto, mantemos a funcionalidade básica
            toast({ 
                title: "Funcionalidade temporariamente indisponível", 
                description: "Use o link 'Esqueci minha senha' na tela de login.",
                variant: "default" 
            });
            requestSuccess = true;
        } catch (error: any) {
            requestError = error.message || "Falha crítica ao tentar solicitar redefinição de senha.";
        } finally {
            setIsRequesting(false);
            if (!requestSuccess && requestError) {
                toast({ title: "Erro ao solicitar redefinição", description: requestError, variant: "destructive" });
            }
        }
    };

    // Funções para verificar a força da nova senha
    const hasMinLength = novaSenha.length >= 8;
    const hasUpperCase = /[A-Z]/.test(novaSenha);
    const hasLowerCase = /[a-z]/.test(novaSenha);
    const hasNumber = /\d/.test(novaSenha);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:'",.<>/?~`]/.test(novaSenha);
    const isNovaSenhaValida = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
    const senhasCoincidentes = novaSenha === confirmarSenha && novaSenha.length > 0;

    React.useEffect(() => {
        if (userData) {
            setIsLoading(false);
        }
    }, [userData]);

    return (
        <Card className="shadow-none">
            <CardContent className="p-6">
                {isLoading && (
                    <SkeletonForm fields={3} />
                )}
                {userData && !isLoading && (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="senhaAtual">Senha Atual</Label>
                                    <div className="relative">
                                        <Input
                                            id="senhaAtual"
                                            type={mostrarSenha ? "text" : "password"}
                                            placeholder="Digite sua senha atual"
                                            value={senhaAtual}
                                            onChange={(e) => setSenhaAtual(e.target.value)}
                                            required
                                            disabled={!userData}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            disabled={!userData}
                                        >
                                            {mostrarSenha ? (
                                                <EyeOffIcon className="h-4 w-4" />
                                            ) : (
                                                <EyeIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Digite sua senha atual para confirmar sua identidade
                                    </p>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="novaSenha">Nova Senha</Label>
                                    <div className="relative">
                                        <Input
                                            id="novaSenha"
                                            type={mostrarSenha ? "text" : "password"}
                                            placeholder="Digite sua nova senha"
                                            value={novaSenha}
                                            onChange={(e) => setNovaSenha(e.target.value)}
                                            required
                                            disabled={!userData}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            disabled={!userData}
                                        >
                                            {mostrarSenha ? (
                                                <EyeOffIcon className="h-4 w-4" />
                                            ) : (
                                                <EyeIcon className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                                        <li className={`flex items-center gap-1 ${novaSenha.length > 0 && (hasMinLength ? 'text-green-500' : 'text-red-500')}`}>
                                            {novaSenha.length === 0 ? <DotIcon className="w-3 h-3" /> : (hasMinLength ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />)}
                                            Mínimo de 8 caracteres
                                        </li>
                                        <li className={`flex items-center gap-1 ${novaSenha.length > 0 && (hasUpperCase ? 'text-green-500' : 'text-red-500')}`}>
                                            {novaSenha.length === 0 ? <DotIcon className="w-3 h-3" /> : (hasUpperCase ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />)}
                                            Pelo menos uma letra maiúscula
                                        </li>
                                        <li className={`flex items-center gap-1 ${novaSenha.length > 0 && (hasLowerCase ? 'text-green-500' : 'text-red-500')}`}>
                                            {novaSenha.length === 0 ? <DotIcon className="w-3 h-3" /> : (hasLowerCase ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />)}
                                            Pelo menos uma letra minúscula
                                        </li>
                                        <li className={`flex items-center gap-1 ${novaSenha.length > 0 && (hasNumber ? 'text-green-500' : 'text-red-500')}`}>
                                            {novaSenha.length === 0 ? <DotIcon className="w-3 h-3" /> : (hasNumber ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />)}
                                            Pelo menos um número
                                        </li>
                                        <li className={`flex items-center gap-1 ${novaSenha.length > 0 && (hasSpecialChar ? 'text-green-500' : 'text-red-500')}`}>
                                            {novaSenha.length === 0 ? <DotIcon className="w-3 h-3" /> : (hasSpecialChar ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />)}
                                            Pelo menos um caractere especial
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                                    <Input
                                        id="confirmarSenha"
                                        type={mostrarSenha ? "text" : "password"}
                                        placeholder="Confirme sua nova senha"
                                        value={confirmarSenha}
                                        onChange={(e) => setConfirmarSenha(e.target.value)}
                                        required
                                        className={confirmarSenha.length > 0 && !senhasCoincidentes ? "border-red-500 focus-visible:ring-red-500" : ""}
                                        disabled={!userData}
                                    />
                                    {confirmarSenha.length > 0 && !senhasCoincidentes && (
                                        <p className="text-xs text-red-500">As senhas não coincidem.</p>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                disabled={!userData || !senhaAtual || !isNovaSenhaValida || !senhasCoincidentes || isSubmitting}
                            >
                                <KeyRoundIcon className="w-4 h-4" />
                                {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
                            </Button>
                        </form>
                        <Separator className="my-6" />
                        <Alert className="border-yellow-200 bg-yellow-50">
                            <MailWarningIcon className="h-4 w-4" color="oklch(47.6% 0.114 61.907)" />
                            <AlertTitle className="text-yellow-800">Esqueceu sua senha?</AlertTitle>
                            <AlertDescription className="flex flex-col gap-2 items-start">
                                <p className="text-yellow-700">Um link para redefinição de senha será enviado para o seu e-mail cadastrado.</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 mt-2 max-w-xs"
                                    onClick={handleRequestReset}
                                    disabled={!userData || isRequesting}
                                >
                                    <MailWarningIcon className="w-4 h-4" />
                                    {isRequesting ? 'Solicitando...' : 'Solicitar Redefinição de Senha'}
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </>
                )}
                {!userData && <ErrorCardContainer />}
            </CardContent>
        </Card>
    );
} 