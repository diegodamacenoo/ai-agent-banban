// React
import * as React from "react";
// UI
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { LogOutIcon, LoaderCircleIcon } from "lucide-react";
import { SkeletonSessionTable } from "@/shared/ui/skeleton-loader";
import { toast } from "@/shared/ui/toast/use-toast";
// Actions
import { getUserSessions, terminateSession, terminateAllOtherSessions } from "@/app/actions/auth/sessions";
import { useRouter } from "next/navigation";
// Types
import type { UserSession } from "@/app/(protected)/settings/types/session-types";

// import PoliticaSenha from "./seguranca-components/politica-senha";
// import AutenticacaoDoisFatores from "./seguranca-components/autenticacao-dois-fatores";
// import TempoInatividade from "./seguranca-components/tempo-inatividade";
// import RestricoesIP from "./seguranca-components/restricoes-ip";
// import ChavesWebhook from "./seguranca-components/chaves-webhook"; // Assumindo que o nome do arquivo Ã© chaves-webhook.tsx

// Components
import LogsAuditoria from "./seguranca-components/logs-auditoria";
import AutenticacaoDoisFatores from "./seguranca-components/autenticacao-dois-fatores";

// Utils
// function copyToClipboard(value: string) {
//   navigator.clipboard.writeText(value);
// }

export default function SettingsSeguranca() {
  const router = useRouter();

  // Estados para política de senha
  const [comprimentoMinimo, setComprimentoMinimo] = React.useState(8);
  const [forcaSenha, setForcaSenha] = React.useState("media");
  const [bloqueioTentativas, setBloqueioTentativas] = React.useState(5);
  const [validadeSenha, setValidadeSenha] = React.useState(90);
  const [senhaExemplo, setSenhaExemplo] = React.useState("");
  const [mostrarSenha, setMostrarSenha] = React.useState(false);

  // Estados para autenticação em dois fatores
  const [ativar2FA, setAtivar2FA] = React.useState(false);
  const [obrigatorio2FA, setObrigatorio2FA] = React.useState(false);
  const [metodo2FA, setMetodo2FA] = React.useState("app");

  // Estados para gerenciamento de tokens API
  const [showTokenDialog, setShowTokenDialog] = React.useState(false);
  const [novoTokenGerado, setNovoTokenGerado] = React.useState("");

  // Estados para sessões ativas
  const [sessoes, setSessoes] = React.useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorSessoes, setErrorSessoes] = React.useState<string | null>(null);
  const [encerrandoSessao, setEncerrandoSessao] = React.useState<string | null>(null);
  const [encerrandoTodas, setEncerrandoTodas] = React.useState(false);

  // Carregar sessões ao montar o componente
  React.useEffect(() => {
    fetchSessoes();
  }, []);

  /**
   * Função para buscar sessões
   */
  const fetchSessoes = async () => {
    setIsLoading(true);
    setErrorSessoes(null);
    try {
      const result = await getUserSessions();
      if (result.error) {
        setErrorSessoes(result.error);
        toast.show({ title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setSessoes(result.data || []);
      }
    } catch (e: any) {
      setErrorSessoes(e.message || "Erro ao carregar sessões");
      toast.show({ title: "Erro",
        description: e.message || "Erro ao carregar sessões",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Função para encerrar uma sessão
   */
  const handleEncerrarSessao = async (id: string) => {
    setEncerrandoSessao(id);
    try {
      const result = await terminateSession({ sessionId: id });
      if (result.success) {
        toast.show({ title: "Sucesso",
          description: "Sessão encerrada com sucesso",
        });
        // Remover a sessão da lista local
        setSessoes(sessoes.filter(s => s.id !== id));
        router.refresh();
      } else {
        toast.show({ title: "Erro",
          description: result.error || "Erro ao encerrar sessão",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast.show({ title: "Erro",
        description: e.message || "Erro ao encerrar sessão",
        variant: "destructive",
      });
    } finally {
      setEncerrandoSessao(null);
    }
  };

  /**
   * Função para encerrar todas as outras sessões
   */
  const handleEncerrarTodasOutrasSessoes = async () => {
    setEncerrandoTodas(true);
    try {
      const result = await terminateAllOtherSessions();
      if (result.success) {
        toast.show({ title: "Sucesso",
          description: "Todas as outras sessões foram encerradas",
        });
        // Manter apenas a sessão atual
        setSessoes(sessoes.filter(s => s.atual));
        router.refresh();
      } else {
        toast.show({ title: "Erro",
          description: result.error || "Erro ao encerrar sessões",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast.show({ title: "Erro",
        description: e.message || "Erro ao encerrar sessões",
        variant: "destructive",
      });
    } finally {
      setEncerrandoTodas(false);
    }
  };

  /**
   * Gera uma senha de exemplo com base nas configurações
   */
  React.useEffect(() => {
    // Caracteres disponíveis para a senha de exemplo
    const caracteres = {
      minusculas: 'abcdefghijklmnopqrstuvwxyz',
      maiusculas: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numeros: '0123456789',
      especiais: '!@#$%^&*()-_=+[]{}|;:,.<>/?'
    };
    // Função para obter um caractere aleatório de uma string
    const getRandomChar = (str: string) => str.charAt(Math.floor(Math.random() * str.length));
    // Caracteres obrigatórios para a senha de exemplo
    const caracteresObrigatorios = [];
    // Se a força da senha for fraca ou média ou forte
    if (forcaSenha === 'fraca' || forcaSenha === 'media' || forcaSenha === 'forte') {
      caracteresObrigatorios.push(getRandomChar(caracteres.minusculas));
      caracteresObrigatorios.push(getRandomChar(caracteres.numeros));
    }
    // Se a força da senha for média ou forte
    if (forcaSenha === 'media' || forcaSenha === 'forte') {
      caracteresObrigatorios.push(getRandomChar(caracteres.maiusculas));
    }
    // Se a força da senha for forte
    if (forcaSenha === 'forte') {
      caracteresObrigatorios.push(getRandomChar(caracteres.especiais));
      if (comprimentoMinimo >= 6) {
        caracteresObrigatorios.push(getRandomChar(caracteres.especiais));
      }
    }
    // Enquanto o comprimento da senha for menor que o comprimento mínimo
    while (caracteresObrigatorios.length < comprimentoMinimo) {
      let pool = '';
      if (forcaSenha === 'fraca') {
        pool = caracteres.minusculas + caracteres.numeros;
      } else if (forcaSenha === 'media') {
        pool = caracteres.minusculas + caracteres.maiusculas + caracteres.numeros;
      } else if (forcaSenha === 'forte') {
        pool = caracteres.minusculas + caracteres.maiusculas + caracteres.numeros + caracteres.especiais;
      }
      caracteresObrigatorios.push(getRandomChar(pool));
    }
    // Garantia final: se for 'forte', a senha deve conter pelo menos um caractere especial
    if (forcaSenha === 'forte' && !caracteresObrigatorios.some(c => caracteres.especiais.includes(c))) {
      // Substitui um caractere aleatório por um especial
      const idx = Math.floor(Math.random() * caracteresObrigatorios.length);
      caracteresObrigatorios[idx] = getRandomChar(caracteres.especiais);
    }
    // Embaralhar os caracteres
    for (let i = caracteresObrigatorios.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [caracteresObrigatorios[i], caracteresObrigatorios[j]] = [caracteresObrigatorios[j], caracteresObrigatorios[i]];
    }
    // Gerar a senha de exemplo
    const senhaGerada = caracteresObrigatorios.join('');
    setSenhaExemplo(senhaGerada);
    // console.debug('Senha gerada:', senhaGerada); // Remover depois de testar
  }, [comprimentoMinimo, forcaSenha]);

  // Filtrar sessões que não são a sessão atual
  const sessoesFiltradas = sessoes.filter(s => !s.atual);
  const temOutrasSessoes = sessoesFiltradas.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex h-16 shrink-0 items-center px-6">
        <h2 className="text-lg font-medium">Segurança</h2>
      </header>

      <div className="px-6 pb-6 space-y-6">

        {/* Sessões Ativas e Dispositivos */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Sessões e Dispositivos</h3>
            <p className="text-sm text-muted-foreground">Gerencie dispositivos conectados e sessões ativas</p>
          </div>
        </div>

        <Card className="shadow-none">
          <CardContent className="p-6">
            {temOutrasSessoes && (
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Dispositivos e locais conectados</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEncerrarTodasOutrasSessoes}
                  disabled={encerrandoTodas || isLoading}
                  className="gap-1.5"
                >
                  {encerrandoTodas ? (
                    <>
                      <LoaderCircleIcon className="w-4 h-4 animate-spin" />
                      Encerrando...
                    </>
                  ) : (
                    <>
                      <LogOutIcon className="w-3.5 h-3.5" />
                      Encerrar todas as outras sessões
                    </>
                  )}
                </Button>
              </div>
            )}

            {isLoading ? (
              <SkeletonSessionTable rows={4} />
            ) : errorSessoes ? (
              <div className="text-center py-8 text-destructive">
                <p>{errorSessoes}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={fetchSessoes}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dispositivo / Navegador</TableHead>
                      <TableHead>Local (IP)</TableHead>
                      <TableHead>Login em</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Mostrar primeiro a sessão atual */}
                    {sessoes
                      .filter(s => s.atual)
                      .map((sessao) => (
                        <TableRow key={sessao.id} className="bg-muted/30">
                          <TableCell>
                            {sessao.dispositivo}
                            <span className="ml-2 text-xs text-green-600 font-semibold">(Sessão Atual)</span>
                          </TableCell>
                          <TableCell>{sessao.local}</TableCell>
                          <TableCell>{sessao.dataHoraLogin}</TableCell>
                          <TableCell className="text-right">
                            {/* Nenhuma ação para sessão atual */}
                          </TableCell>
                        </TableRow>
                      ))}

                    {/* Mostrar outras sessões */}
                    {sessoesFiltradas.map((sessao) => (
                      <TableRow key={sessao.id}>
                        <TableCell>
                          {sessao.dispositivo}
                        </TableCell>
                        <TableCell>{sessao.local}</TableCell>
                        <TableCell>{sessao.dataHoraLogin}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEncerrarSessao(sessao.id)}
                            disabled={encerrandoSessao === sessao.id}
                            className="gap-1.5 text-xs h-7"
                          >
                            {encerrandoSessao === sessao.id ? (
                              <>
                                <LoaderCircleIcon className="w-3.5 h-3.5 animate-spin" />
                                Encerrando...
                              </>
                            ) : (
                              <>
                                <LogOutIcon className="w-3.5 h-3.5" />
                                Encerrar
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sessoes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma sessão ativa encontrada.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Logs de Auditoria */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Logs de Auditoria</h3>
            <p className="text-sm text-muted-foreground">Registro de atividades de segurança no sistema</p>
          </div>
        </div>
        <LogsAuditoria />

      </div>

      {/* Dialog para exibir o token recém-gerado - Desabilitado temporariamente */}
      {/* <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token gerado com sucesso</DialogTitle>
            <DialogDescription>
              Este token só será exibido uma vez. Copie-o agora e guarde em um local seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
            {novoTokenGerado}
          </div>
          <p className="text-amber-500 flex items-center gap-2 text-sm">
            <AlertTriangleIcon className="w-4 h-4" />
            Este token concede acesso aos seus dados. Não compartilhe com ninguém.
          </p>
          <DialogFooter>
            <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(novoTokenGerado)}>
              <CopyIcon className="w-4 h-4" />
              Copiar para área de transferência
            </Button>
            <Button variant="outline" onClick={() => setShowTokenDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Componentes comentados mantidos para referência futura */}
      {/* Política de Senha - Desabilitado temporariamente */}
      {/*<div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Política de Senha</h3>
            <p className="text-sm text-muted-foreground">Defina regras para criação e renovação de senhas</p>
          </div>
          <Button size="sm" variant="outline" className="gap-2">
            <SaveIcon className="w-4 h-4" />
            Salvar
          </Button>
        </div>
        <PoliticaSenha
          comprimentoMinimo={comprimentoMinimo}
          setComprimentoMinimo={setComprimentoMinimo}
          forcaSenha={forcaSenha}
          setForcaSenha={setForcaSenha}
          bloqueioTentativas={bloqueioTentativas}
          setBloqueioTentativas={setBloqueioTentativas}
          validadeSenha={validadeSenha}
          setValidadeSenha={setValidadeSenha}
          senhaExemplo={senhaExemplo}
          mostrarSenha={mostrarSenha}
          setMostrarSenha={setMostrarSenha}
        />*/}
    </div>
  );
} 
