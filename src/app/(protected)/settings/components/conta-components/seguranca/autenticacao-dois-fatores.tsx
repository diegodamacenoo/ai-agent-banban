import * as React from "react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MessageSquareIcon, MailIcon, FileTextIcon, RefreshCcwIcon, InfoIcon, Loader2, XCircleIcon, AlertTriangleIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/app/contexts/UserContext";
import { enrollMFA, getAuthLevel, listMFAFactors, unenrollMFA, verifyMFA } from "@/app/actions/auth/mfa";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { createLogger } from "@/lib/utils/logger";
import { DEBUG_MODULES } from "@/lib/utils/debug-config";

// Criar logger para o componente de autenticação de dois fatores
const logger = createLogger(DEBUG_MODULES.UI_SETTINGS);

// Constante para timeout da configuração em milissegundos (10 minutos)
const CONFIG_TIMEOUT = 10 * 60 * 1000;

export default function AutenticacaoDoisFatores() {
    const [status2FA, setStatus2FA] = React.useState(false);
    const [metodo2FA, setMetodo2FA] = React.useState("totp"); // 'totp' (app autenticador) ou 'sms'
    const [mostrarSetup, setMostrarSetup] = React.useState(false);
    const [carregando, setCarregando] = React.useState(true);
    const [carregandoQrCode, setCarregandoQrCode] = React.useState(false);
    const [setupData, setSetupData] = React.useState<any>(null);
    const [codigoVerificacao, setCodigoVerificacao] = React.useState("");
    const [verificando, setVerificando] = React.useState(false);
    const [erro, setErro] = React.useState<string | null>(null);
    const [fatorExistente, setFatorExistente] = React.useState<any>(null);
    const [tempoLimiteAtivo, setTempoLimiteAtivo] = React.useState(false);
    const { userData } = useUser();
    const { toast } = useToast();
    
    // Referência para armazenar o ID do timer de tempo limite
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Referência para armazenar o factorId pendente para limpeza em caso de desmontagem
    const pendingFactorIdRef = useRef<string | null>(null);
    
    // Carrega o estado atual do 2FA ao montar o componente
    useEffect(() => {
        carregarStatus2FA();
        
        // Cleanup function para quando o componente for desmontado
        return () => {
            // Limpar qualquer timer de timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            // Se houver um fator pendente de configuração, tenta removê-lo ao desmontar
            const pendingFactorId = pendingFactorIdRef.current;
            if (pendingFactorId) {
                // Usar um setTimeout para que a chamada da API continue mesmo após o componente ser desmontado
                setTimeout(async () => {
                    try {
                        await unenrollMFA(pendingFactorId);
                        logger.debug("Fator pendente removido durante desmontagem:", pendingFactorId);
                    } catch (err) {
                        logger.error("Erro ao remover fator pendente durante desmontagem:", err);
                    }
                }, 0);
            }
        };
    }, []);
    
    // Configura o timer de timeout quando o setup é iniciado
    useEffect(() => {
        // Se o setup estiver ativo e não houver um fator verificado
        if (mostrarSetup && setupData && !fatorExistente) {
            // Limpar qualquer timeout existente
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            
            // Definir um novo timeout
            timeoutRef.current = setTimeout(() => {
                setTempoLimiteAtivo(true);
                toast({
                    title: "Tempo limite excedido",
                    description: "O tempo para configuração do 2FA expirou. Por favor, tente novamente.",
                    variant: "destructive",
                    duration: 5000,
                });
                
                // Cancelar a configuração
                cancelarSetup();
                
                // Se houver um fator pendente, tenta removê-lo
                if (setupData && setupData.factorId) {
                    unenrollMFA(setupData.factorId).catch(err => {
                        logger.error("Erro ao remover fator após timeout:", err);
                    });
                }
            }, CONFIG_TIMEOUT);
            
            // Registrar o fatorId pendente
            if (setupData && setupData.factorId) {
                pendingFactorIdRef.current = setupData.factorId;
            }
        } else {
            // Se o setup não estiver ativo ou o fator estiver verificado, limpar o timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            
            // Se o fator foi verificado ou o setup foi cancelado, limpar a referência ao fator pendente
            if (!mostrarSetup) {
                pendingFactorIdRef.current = null;
            }
        }
        
        // Limpar o timeout ao desmontar
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [mostrarSetup, setupData, fatorExistente]);

    // Função para carregar os status do 2FA e fatores
    async function carregarStatus2FA() {
        logger.debug("Iniciando carregarStatus2FA");
        setCarregando(true);
        setErro(null);
        
        try {
            // Verificar fatores MFA existentes
            logger.debug("Chamando listMFAFactors");
            const { success, data, error } = await listMFAFactors();
            logger.debug("Resultado listMFAFactors:", { success, data: data ? "dados presentes" : "sem dados", error });
            
            if (success && data) {
                // Verificar se há um fator ativo
                const fatorAtivo = data.totp.find((f: any) => f.status === 'verified');
                
                if (fatorAtivo) {
                    logger.debug("Fator ativo encontrado:", fatorAtivo.id);
                    setFatorExistente(fatorAtivo);
                    setStatus2FA(true);
                    setMostrarSetup(false); // Garantir que o setup não seja mostrado para fatores já verificados
                } else {
                    // Verificar se há fatores pendentes de verificação
                    const fatoresPendentes = data.totp.filter((f: any) => f.status === 'unverified');
                    
                    // Limpar todos os fatores pendentes
                    if (fatoresPendentes.length > 0) {
                        logger.debug(`Removendo ${fatoresPendentes.length} fatores pendentes encontrados`);
                        
                        // Remover cada fator pendente
                        for (const fator of fatoresPendentes) {
                            try {
                                await unenrollMFA(fator.id);
                                logger.debug(`Fator pendente removido: ${fator.id}`);
                            } catch (err) {
                                logger.error(`Erro ao remover fator pendente ${fator.id}:`, err);
                            }
                        }
                    }
                    
                    setFatorExistente(null);
                    setStatus2FA(false);
                    setMostrarSetup(false); // Garantir estado limpo
                }
            } else if (error) {
                logger.error("Erro ao listar fatores MFA:", error);
                setErro(error);
                // Em caso de erro ao listar fatores, definimos status como false por segurança
                setStatus2FA(false);
                setMostrarSetup(false);
            }
        } catch (error) {
            logger.error("Erro ao carregar status 2FA:", error);
            setErro("Ocorreu um erro ao carregar as informações de autenticação de dois fatores.");
            // Em caso de erro, definimos status como false por segurança
            setStatus2FA(false);
            setMostrarSetup(false);
        } finally {
            setCarregando(false);
            setTempoLimiteAtivo(false); // Resetar o indicador de tempo limite
            logger.debug("Finalizando carregarStatus2FA");
        }
    }

    const handleStatusChange = async (checked: boolean) => {
        logger.debug("handleStatusChange:", checked);
        // Limpar erros ao mudar status
        setErro(null);
        
        if (checked) {
            // Ativar 2FA - iniciar processo de configuração
            await iniciarSetup2FA();
        } else {
            // Se estiver no meio do processo de configuração
            if (mostrarSetup && !fatorExistente) {
                cancelarSetup();
            } else {
                // Desativar 2FA existente
                await desativar2FA();
            }
        }
    };

    const cancelarSetup = () => {
        logger.debug("Cancelando setup");
        // Cancelar o processo de configuração sem salvar
        
        // Se houver um fator pendente no setupData, tenta removê-lo
        if (setupData && setupData.factorId) {
            const factorIdToRemove = setupData.factorId;
            
            // Limpar a referência ao fator pendente
            pendingFactorIdRef.current = null;
            
            // Tentar remover o fator pendente
            unenrollMFA(factorIdToRemove).catch(err => {
                logger.error("Erro ao remover fator durante cancelamento:", err);
            });
        }
        
        // Limpar o timeout se existir
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        // Limpar o estado de configuração
        setMostrarSetup(false);
        setStatus2FA(false);
        setSetupData(null);
        setCodigoVerificacao("");
        setErro(null);
        setTempoLimiteAtivo(false);
        
        toast({
            title: "Configuração cancelada",
            description: "O processo de configuração do 2FA foi cancelado.",
            duration: 3000,
        });
    };

    const iniciarSetup2FA = async () => {
        logger.debug("Iniciando setup 2FA");
        // Limpar estado anterior
        setMostrarSetup(true);
        setErro(null);
        setCarregandoQrCode(true);
        setTempoLimiteAtivo(false);
        setStatus2FA(true); // Já define status como true para melhor feedback
        
        try {
            // Primeiro vamos verificar se há fatores pendentes e removê-los
            logger.debug("Verificando fatores pendentes");
            // Limpeza explícita de todos os fatores TOTP não verificados
            const { success: listSuccess, data: listData, error: listError } = await listMFAFactors();
            if (listSuccess && listData && listData.totp.length > 0) {
                for (const fator of listData.totp) {
                    if (fator.status !== 'verified') {
                        try {
                            await unenrollMFA(fator.id);
                            logger.debug(`Fator pendente removido antes do enroll: ${fator.id}`);
                        } catch (err) {
                            logger.error(`Erro ao remover fator pendente antes do enroll ${fator.id}:`, err);
                        }
                    }
                }
            }
            // Tentar iniciar o processo de inscrição
            logger.debug("Chamando enrollMFA");
            const { success, data, error } = await enrollMFA();
            logger.debug("Resposta enrollMFA:", { success, error, data: data ? "dados presentes" : "sem dados" });
            
            if (success && data) {
                logger.debug("MFA enrollment bem-sucedido, processando QR code");
                // Limpar o prefixo data:image/svg+xml;utf-8, do QR code
                if (data.qrCode && data.qrCode.startsWith('data:image/svg+xml;utf-8,')) {
                    data.qrCode = data.qrCode.substring('data:image/svg+xml;utf-8,'.length);
                }
                setSetupData(data);
                
                // Registrar o factorId para possível limpeza posterior
                pendingFactorIdRef.current = data.factorId;
                logger.debug("Factor ID registrado:", data.factorId);
            } else if (error) {
                logger.error("Erro ao iniciar enroll MFA:", error);
                setErro(error);
                setMostrarSetup(false);
                setStatus2FA(false); // Redefine status para false em caso de erro
                
                toast({
                    title: "Erro ao configurar 2FA",
                    description: error || "Não foi possível iniciar a configuração. Por favor, tente novamente mais tarde.",
                    variant: "destructive",
                    duration: 5000,
                });
            }
        } catch (error: any) {
            logger.error("Exceção ao iniciar setup 2FA:", error);
            logger.error("Detalhes do erro:", error?.message);
            
            setErro("Ocorreu um erro ao iniciar a configuração de autenticação de dois fatores: " + (error?.message || ""));
            setMostrarSetup(false);
            setStatus2FA(false); // Redefine status para false em caso de erro
            
            toast({
                title: "Erro ao configurar 2FA",
                description: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setCarregandoQrCode(false);
            logger.debug("Finalizando iniciarSetup2FA");
        }
    };

    const desativar2FA = async () => {
        logger.debug("Iniciando desativação 2FA");
        setErro(null);
        
        try {
            // Se já temos o ID do fator existente, usamos ele
            if (fatorExistente && fatorExistente.id) {
                logger.debug("Desativando fator existente:", fatorExistente.id);
                const { success, error } = await unenrollMFA(fatorExistente.id);
                
                if (success) {
                    setStatus2FA(false);
                    setMostrarSetup(false);
                    setFatorExistente(null);
                    setSetupData(null);
                    pendingFactorIdRef.current = null; // Limpar qualquer referência a fatores pendentes
                    
                    toast({
                        title: "2FA desativado",
                        description: "A autenticação de dois fatores foi desativada com sucesso.",
                        duration: 5000,
                    });
                } else if (error) {
                    logger.error("Erro ao desativar MFA:", error);
                    setErro(error);
                    
                    toast({
                        title: "Erro ao desativar 2FA",
                        description: "Não foi possível desativar o 2FA. Por favor, tente novamente.",
                        variant: "destructive",
                        duration: 5000,
                    });
                }
            } else {
                // Caso não tenhamos o ID, buscamos da lista
                logger.debug("Buscando fatores para desativar");
                const { success: listSuccess, data, error: listError } = await listMFAFactors();
                
                if (listSuccess && data && data.totp.length > 0) {
                    // Encontra todos os fatores TOTP (ativos ou pendentes)
                    const fatores = data.totp;
                    let todosRemovidos = true;
                    
                    logger.debug(`Encontrados ${fatores.length} fatores para remover`);
                    
                    // Vamos remover todos os fatores encontrados
                    for (const fator of fatores) {
                        try {
                            await unenrollMFA(fator.id);
                            logger.debug(`Fator ${fator.id} removido com sucesso`);
                        } catch (err) {
                            logger.error(`Erro ao remover fator ${fator.id}:`, err);
                            todosRemovidos = false;
                        }
                    }
                    
                    setStatus2FA(false);
                    setMostrarSetup(false);
                    setFatorExistente(null);
                    setSetupData(null);
                    pendingFactorIdRef.current = null; // Limpar qualquer referência a fatores pendentes
                    
                    if (todosRemovidos) {
                        toast({
                            title: "2FA desativado",
                            description: "A autenticação de dois fatores foi desativada com sucesso.",
                            duration: 5000,
                        });
                    } else {
                        toast({
                            title: "2FA parcialmente desativado",
                            description: "Alguns fatores podem não ter sido removidos. Por favor, atualize a página e tente novamente se necessário.",
                            variant: "destructive",
                            duration: 8000,
                        });
                    }
                } else if (listError) {
                    logger.error("Erro ao listar fatores MFA:", listError);
                    setErro(listError);
                    
                    toast({
                        title: "Erro ao desativar 2FA",
                        description: "Não foi possível obter os fatores de autenticação para desativação.",
                        variant: "destructive",
                        duration: 5000,
                    });
                }
            }
            
            // Recarregar o status para garantir sincronização
            logger.debug("Recarregando status após desativação");
            await carregarStatus2FA();
        } catch (error) {
            logger.error("Erro ao desativar 2FA:", error);
            setErro("Ocorreu um erro ao desativar a autenticação de dois fatores.");
            
            toast({
                title: "Erro ao desativar 2FA",
                description: "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
                variant: "destructive",
                duration: 5000,
            });
        }
    };

    const verificarCodigo = async () => {
        if (!setupData || !codigoVerificacao || codigoVerificacao.length !== 6) {
            setErro("Por favor, insira um código de 6 dígitos.");
            return;
        }
        
        setVerificando(true);
        setErro(null);
        
        try {
            const { success, error } = await verifyMFA(setupData.factorId, codigoVerificacao);
            
            if (success) {
                // Processo de verificação bem-sucedido
                
                // Limpar o timeout, já que a verificação foi concluída
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                
                // Limpar a referência ao fator pendente, já que agora está verificado
                pendingFactorIdRef.current = null;
                
                await carregarStatus2FA(); // Recarrega os dados para atualizar fatorExistente
                setStatus2FA(true);
                setMostrarSetup(false);
                setCodigoVerificacao("");
                setTempoLimiteAtivo(false);
                
                toast({
                    title: "2FA ativado",
                    description: "A autenticação de dois fatores foi configurada com sucesso.",
                    duration: 5000,
                });
            } else if (error) {
                logger.error("Erro ao verificar código:", error);
                setErro(error);
                // Se a verificação falhar, mantemos o status do 2FA como true, pois ainda estamos no processo
                
                // Verificar se o erro indica código inválido ou expirado
                if (error.includes("inválido") || error.includes("expirado")) {
                    toast({
                        title: "Código inválido",
                        description: "O código inserido é inválido ou expirou. Por favor, tente novamente.",
                        variant: "destructive",
                        duration: 5000,
                    });
                } else {
                    toast({
                        title: "Erro na verificação",
                        description: "Ocorreu um erro ao verificar o código. Por favor, tente novamente.",
                        variant: "destructive",
                        duration: 5000,
                    });
                }
            }
        } catch (error) {
            logger.error("Erro ao verificar código 2FA:", error);
            setErro("Ocorreu um erro ao verificar o código de autenticação.");
            // Não alteramos o status pois ainda estamos no processo
            
            toast({
                title: "Erro na verificação",
                description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
                variant: "destructive",
                duration: 5000,
            });
        } finally {
            setVerificando(false);
        }
    };

    // Otimiza o input para entrada rápida do código
    const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove caracteres não numéricos e limita a 6 dígitos
        const value = e.target.value.replace(/\D/g, '').substring(0, 6);
        setCodigoVerificacao(value);
        
        // Se o código tiver 6 dígitos e não estiver verificando, verificar automaticamente
        if (value.length === 6 && !verificando && setupData) {
            // Opcional: podemos verificar automaticamente quando o código tiver 6 dígitos
            // verificarCodigo();
        }
    };

    // Renderizar estado de carregamento
    if (carregando) {
        return (
            <Card className="shadow-none">
                <CardContent className="p-6 flex justify-center items-center min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-none">
            <CardContent className="p-6 space-y-6">
                {erro && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{erro}</AlertDescription>
                    </Alert>
                )}
                
                {tempoLimiteAtivo && (
                    <Alert variant="destructive" className="mb-4 bg-amber-50 border-amber-200">
                        <AlertTriangleIcon className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-600">Tempo limite excedido</AlertTitle>
                        <AlertDescription className="text-amber-700">
                            O tempo para configuração do 2FA expirou. Por favor, tente novamente.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="status-2fa" className="font-medium">
                        Status da Autenticação em Dois Fatores
                    </Label>
                    <Switch
                        id="status-2fa"
                        checked={status2FA}
                        onCheckedChange={handleStatusChange}
                    />
                </div>

                {mostrarSetup && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h3 className="font-medium">Configurar Autenticação de Dois Fatores</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0" 
                                onClick={cancelarSetup}
                            >
                                <XCircleIcon className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <div className="space-y-2">
                            <p className="text-sm">
                                Escaneie o QR code abaixo com seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy, etc).
                            </p>
                            
                            <div className="flex flex-col items-center space-y-4 p-4 bg-muted rounded-md">
                                {carregandoQrCode ? (
                                    <div className="w-48 h-48 flex items-center justify-center">
                                        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                                    </div>
                                ) : setupData ? (
                                    <div 
                                        className="w-48 h-48 bg-white p-2 rounded-md" 
                                        dangerouslySetInnerHTML={{ __html: setupData.qrCode }} 
                                    />
                                ) : null}
                                
                                {setupData && (
                                    <div className="w-full">
                                        <Label htmlFor="secret-key" className="text-xs font-medium mb-1 block">
                                            Ou insira esta chave manualmente:
                                        </Label>
                                        <div className="flex items-center space-x-2">
                                            <Input 
                                                id="secret-key" 
                                                value={setupData.secret} 
                                                readOnly 
                                                className="font-mono text-sm"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(setupData.secret);
                                                    toast({
                                                        title: "Copiado!",
                                                        description: "A chave secreta foi copiada para a área de transferência.",
                                                        duration: 3000,
                                                    });
                                                }}
                                            >
                                                Copiar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="verification-code">Insira o código do aplicativo autenticador</Label>
                            <div className="flex space-x-2">
                                <Input
                                    id="verification-code"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={codigoVerificacao}
                                    onChange={handleCodigoChange}
                                    className="text-center font-mono text-lg tracking-wider"
                                    type="tel"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                />
                                <Button 
                                    onClick={verificarCodigo} 
                                    disabled={verificando || codigoVerificacao.length !== 6 || tempoLimiteAtivo}
                                >
                                    {verificando ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Verificar
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Digite o código de 6 dígitos exibido no seu aplicativo autenticador.
                                {setupData && (
                                    <span className="block mt-1">Você tem 10 minutos para completar esta configuração.</span>
                                )}
                            </p>
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={cancelarSetup}
                                disabled={verificando}
                            >
                                Cancelar configuração
                            </Button>
                        </div>
                    </div>
                )}

                {status2FA && !mostrarSetup && (
                    <div className="space-y-3 pt-4 border-t">
                        <Alert className="bg-green-50 border-green-200">
                            <InfoIcon className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-600">2FA está ativo</AlertTitle>
                            <AlertDescription className="text-green-700">
                                Sua conta está protegida com autenticação de dois fatores.
                            </AlertDescription>
                        </Alert>
                        
                        <div className="flex justify-end space-x-2 pt-2">
                            <Button 
                                variant="destructive" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleStatusChange(false)}
                            >
                                <RefreshCcwIcon className="w-4 h-4" /> Desativar 2FA
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 