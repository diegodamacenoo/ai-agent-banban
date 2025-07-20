import * as React from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { GenericDialog } from "../common/dialog/generic-dialog";
import { GenericTable } from "../common/table/generic-table";
import { PerfilDialog } from "./components/perfil-dialog";
import { usePerfilUsuario } from "../../contexts/perfis-context";
import { UserProfile } from "../../types/perfis";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

interface PerfisUsuariosState {
  dialogAberto: boolean;
  perfilEditando: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

export default function PerfisUsuarios() {
  const { perfis, criarPerfil, editarPerfil, removerPerfil, isLoading: isContextLoading, error: contextError } = usePerfilUsuario();
  const [state, setState] = React.useState<PerfisUsuariosState>({
    dialogAberto: false,
    perfilEditando: null,
    isLoading: false,
    error: null,
  });

  const colunas = [
    {
      header: "UsuÃ¡rio",
      cell: (perfil: UserProfile) => (
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={perfil.avatar_url || undefined} />
            <AvatarFallback>{`${perfil.first_name?.[0]}${perfil.last_name?.[0]}`}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{`${perfil.first_name} ${perfil.last_name}`}</div>
            <div className="text-sm text-muted-foreground">{perfil.username}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Cargo",
      cell: (perfil: UserProfile) => (
        <div>
          <div>{perfil.job_title}</div>
          <div className="text-sm text-muted-foreground">{perfil.team}</div>
        </div>
      ),
    },
    {
      header: "FunÃ§Ã£o",
      cell: (perfil: UserProfile) => (
        <Badge variant={perfil.role === "organization_admin" ? "default" : "secondary"}>
          {perfil.role === "organization_admin" ? "Administrador" : "UsuÃ¡rio PadrÃ£o"}
        </Badge>
      ),
    },
    {
      header: "Status",
      cell: (perfil: UserProfile) => {
        const statusConfig = {
          active: { label: "Ativo", variant: "outline" },
          inactive: { label: "Inativo", variant: "secondary" },
          suspended: { label: "Suspenso", variant: "destructive" },
        };
        const config = statusConfig[perfil.status];
        return <Badge variant={config.variant as any}>{config.label}</Badge>;
      },
    },
    {
      header: "Contato",
      cell: (perfil: UserProfile) => (
        <div>
          <div className="text-sm">{perfil.phone}</div>
          <div className="text-sm text-muted-foreground">{perfil.location}</div>
        </div>
      ),
    },
    {
      header: "AÃ§Ãµes",
      cell: (perfil: UserProfile) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editarPerfilHandler(perfil)}
            disabled={state.isLoading}
          >
            <EditIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoverPerfil(perfil.id)}
            disabled={state.isLoading}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const abrirNovoPerfil = () => {
    setState({
      dialogAberto: true,
      perfilEditando: null,
      isLoading: false,
      error: null,
    });
  };

  const editarPerfilHandler = (perfil: UserProfile) => {
    setState({
      dialogAberto: true,
      perfilEditando: perfil,
      isLoading: false,
      error: null,
    });
  };

  const handleOpenChange = (open: boolean) => {
    setState(prev => ({ ...prev, dialogAberto: open }));
  };

  const handleRemoverPerfil = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este perfil?")) {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        await removerPerfil(id);
      } catch (error: any) {
        setState(prev => ({ ...prev, error: error.message }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  const salvarPerfil = async (dadosFormulario: Partial<UserProfile>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      if (state.perfilEditando && state.perfilEditando.id) {
        await editarPerfil({
          ...state.perfilEditando,
          ...dadosFormulario,
        });
      } else {
        await criarPerfil(dadosFormulario as Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>);
      }
      setState(prev => ({ ...prev, dialogAberto: false, perfilEditando: null }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || "Erro ao salvar o perfil. Tente novamente." }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (isContextLoading) return <div className="p-6">Carregando...</div>;
  if (contextError) return <div className="p-6 text-red-500">{contextError}</div>;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-medium">Perfis de UsuÃ¡rios</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os perfis e permissÃµes dos usuÃ¡rios
            </p>
          </div>
          <Button onClick={abrirNovoPerfil} disabled={state.isLoading}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Perfil
          </Button>
        </div>

        {state.error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-6">
            {state.error}
          </div>
        )}

        <GenericTable
          data={perfis}
          columns={colunas}
          className="w-full"
        />

        <PerfilDialog
          open={state.dialogAberto}
          onOpenChange={handleOpenChange}
          onSalvar={salvarPerfil}
          perfil={state.perfilEditando || undefined}
          isLoading={state.isLoading}
        />
      </CardContent>
    </Card>
  );
}
