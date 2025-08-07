import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/shared/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/shared/ui/dialog';
import {
  MoreHorizontal,
  Settings,
  RefreshCw,
  Trash2,
  Clipboard,
  Wrench,
  TestTube,
  Construction,
  Target,
  CheckCircle,
  Hammer,
  XCircle,
  Archive,
  CircleMinus,
  ArchiveRestore
} from 'lucide-react';
import { CoreModule, ModuleMaturity } from '@/shared/types/module-catalog';
import { useToast } from '@/shared/ui/toast';
import { useState } from 'react';

interface ModuleActionsMenuProps {
  module: CoreModule;
  isOrphan: boolean;
  onArchive: (moduleId: string) => Promise<void>;
  onUnarchive: (moduleId: string) => Promise<void>;
  onMaturityChange: (moduleId: string, newMaturity: ModuleMaturity) => Promise<void>;
  onDelete?: (moduleId: string) => Promise<void>;
}

export function ModuleActionsMenu({module, 
  isOrphan, 
  onArchive,
  onUnarchive, 
  onMaturityChange,
  onDelete 
}: ModuleActionsMenuProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await onArchive(module.id);
    } catch (error) {
      console.error('Erro ao arquivar módulo:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      await onUnarchive(module.id);
    } catch (error) {
      console.error('Erro ao desarquivar módulo:', error);
    } finally {
      setIsUnarchiving(false);
    }
  };

  const handleMaturityChange = (newMaturity: ModuleMaturity) => {
    onMaturityChange(module.id, newMaturity);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(module.id);
      toast.success("Módulo removido", {
        description: `O módulo ${module.name} foi removido permanentemente.`,
      });
    } catch (error) {
      toast.error("Erro ao remover módulo", {
        description: "Ocorreu um erro inesperado ao remover o módulo.",
      });
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isOrphan) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="success"
            onClick={() => router.push(`/admin/modules/${module.id}/restore`)}
            icon={RefreshCw}
          >
            Restaurar Módulo
          </DropdownMenuItem>
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem
                variant="destructive"
                icon={Trash2}
                onSelect={(e) => e.preventDefault()}
              >
                Remover Registro
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-600">
                  Tem certeza que deseja excluir este módulo permanentemente?
                </DialogTitle>
                <DialogDescription>
                  Esta ação é irreversível e irá excluir permanentemente o módulo "{module.name}" do sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 font-medium text-sm">
                    Esta ação é IRREVERSÍVEL e irá:
                  </p>
                  <ul className="text-red-700 text-sm mt-2 space-y-1 list-disc list-inside">
                    <li>Excluir permanentemente todos os dados do módulo</li>
                    <li>Remover todas as configurações associadas</li>
                    <li>Tornar impossível a recuperação dos dados</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isDeleting}>
                    Cancelar
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-700 hover:bg-red-800"
                >
                  {isDeleting ? "Removendo..." : "Remover Permanentemente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/admin/modules/${module.id}/configure`)}
          icon={Settings}
        >
          <span>Configurar Módulo</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Ordem crescente de maturidade */}
        <DropdownMenuItem
          onClick={() => handleMaturityChange('PLANNED')}
          disabled={module.maturity_status === 'PLANNED'}
          icon={Clipboard}
        >
          <span>Marcar como Planejamento</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleMaturityChange('IN_DEVELOPMENT')}
          disabled={module.maturity_status === 'IN_DEVELOPMENT'}
          icon={Wrench}
        >
          <span>Marcar como Em Desenvolvimento</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleMaturityChange('ALPHA')}
          disabled={module.maturity_status === 'ALPHA'}
          icon={TestTube}
        >
          <span>Marcar como Alpha (Testes Internos)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleMaturityChange('BETA')}
          disabled={module.maturity_status === 'BETA'}
          icon={Construction}
        >
          <span>Marcar como Beta (Testes Limitados)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleMaturityChange('RC')}
          disabled={module.maturity_status === 'RC'}
          icon={Target}
        >
          <span>Marcar como Release Candidate</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleMaturityChange('GA')}
          disabled={module.maturity_status === 'GA'}
          icon={CheckCircle}
        >
          <span>Promover para Produção (GA)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleMaturityChange('MAINTENANCE')}
          disabled={module.maturity_status === 'MAINTENANCE'}
          icon={Hammer}
        >
          <span>Marcar como Manutenção</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Estados finais */}
        <DropdownMenuItem
          onClick={() => handleMaturityChange('DEPRECATED')}
          disabled={module.maturity_status === 'DEPRECATED'}
          icon={XCircle}
          variant="destructive"
        >
          <span>Marcar como Obsoleto</span>
        </DropdownMenuItem>

        {!module.is_archived && (
          <Dialog>
            <DialogTrigger asChild>
              <DropdownMenuItem
                icon={Archive}
                variant="warning"
                onSelect={(e) => e.preventDefault()}
              >
                Arquivar Módulo Core
              </DropdownMenuItem>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-amber-600">
                Arquivar Módulo Core
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja arquivar o módulo core "{module.name}"?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-amber-800 font-medium text-sm">
                  Esta ação irá:
                </p>
                <ul className="text-amber-700 text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>Marcar o módulo core como arquivado</li>
                  <li>Desatribuir automaticamente de todos os tenants</li>
                  <li>Manter o módulo visível no sistema para consulta</li>
                  <li>Impedir novas atribuições até ser desarquivado</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                O módulo pode ser desarquivado posteriormente se necessário.
              </p>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isArchiving}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={handleArchive}
                disabled={isArchiving}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isArchiving ? "Arquivando..." : "Arquivar Módulo Core"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        )}

        {module.is_archived && (
          <DropdownMenuItem
            onClick={handleUnarchive}
            disabled={isUnarchiving}
            icon={ArchiveRestore}
            variant="success"
          >
            {isUnarchiving ? "Desarquivando..." : "Desarquivar Módulo Core"}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleMaturityChange('RETIRED')}
          disabled={module.maturity_status === 'RETIRED'}
          icon={CircleMinus}
          variant="destructive"
        >
          <span>Aposentar Módulo</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}