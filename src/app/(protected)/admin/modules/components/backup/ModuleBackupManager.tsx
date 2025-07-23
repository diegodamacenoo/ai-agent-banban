'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { useToast } from '@/shared/ui/toast';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Download,
  Upload,
  Trash2,
  Archive,
  Clock,
  HardDrive,
  Shield,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Settings,
  Database,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  createModuleBackup,
  listModuleBackups,
  restoreModuleBackup,
  deleteModuleBackup,
  type ModuleBackup,
  type CreateBackupInput,
} from '@/app/actions/admin/modules/module-backups';

interface ModuleBackupManagerProps {
  implementationId: string;
  implementationName: string;
  onBackupCreated?: () => void;
  onBackupRestored?: () => void;
}

export function ModuleBackupManager({
  implementationId,
  implementationName,
  onBackupCreated,
  onBackupRestored,
}: ModuleBackupManagerProps) {
  const { toast } = useToast();
  const [backups, setBackups] = useState<ModuleBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<ModuleBackup | null>(null);
  
  // Form states
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'config_only'>('full');
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreType, setRestoreType] = useState<'full' | 'config_only'>('full');

  // Carregar backups
  useEffect(() => {
    loadBackups();
  }, [implementationId]);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const result = await listModuleBackups(implementationId);
      
      if (result.success && result.data) {
        setBackups(result.data);
      } else {
        toast.error('Erro', {
          description: result.error || 'Erro ao carregar backups'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      toast.error('Erro', {
        description: 'Erro inesperado ao carregar backups'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      
      const input: CreateBackupInput = {
        implementation_id: implementationId,
        backup_type: backupType,
        description: backupDescription || undefined,
      };
      
      const result = await createModuleBackup(input);
      
      if (result.success) {
        toast.success('Backup criado', {
          description: result.message || 'Backup criado com sucesso'
        });
        setCreateDialogOpen(false);
        setBackupDescription('');
        loadBackups();
        onBackupCreated?.();
      } else {
        toast.error('Erro ao criar backup', {
          description: result.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro', {
        description: 'Erro inesperado ao criar backup'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    try {
      setRestoring(selectedBackup.id);
      
      const result = await restoreModuleBackup({
        backup_id: selectedBackup.id,
        restore_type: restoreType,
      });
      
      if (result.success) {
        toast.success('Backup restaurado', {
          description: result.message || 'Backup restaurado com sucesso'
        });
        setRestoreDialogOpen(false);
        setSelectedBackup(null);
        onBackupRestored?.();
      } else {
        toast.error('Erro ao restaurar backup', {
          description: result.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro', {
        description: 'Erro inesperado ao restaurar backup'
      });
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      setDeleting(backupId);
      
      const result = await deleteModuleBackup(backupId);
      
      if (result.success) {
        toast.success('Backup excluído', {
          description: 'Backup excluído com sucesso'
        });
        loadBackups();
      } else {
        toast.error('Erro ao excluir backup', {
          description: result.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao excluir backup:', error);
      toast.error('Erro', {
        description: 'Erro inesperado ao excluir backup'
      });
    } finally {
      setDeleting(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Database className="w-4 h-4" />;
      case 'incremental':
        return <RefreshCw className="w-4 h-4" />;
      case 'config_only':
        return <Settings className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getBackupTypeBadge = (type: string) => {
    switch (type) {
      case 'full':
        return <Badge variant="default">Completo</Badge>;
      case 'incremental':
        return <Badge variant="secondary">Incremental</Badge>;
      case 'config_only':
        return <Badge variant="outline">Configurações</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Backups</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie backups da implementação
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            leftIcon={<Archive className="w-4 h-4" />}
          >
            Criar Backup
          </Button>
        </div>

        {/* Lista de backups */}
        {backups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Archive className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground text-center">
                Nenhum backup encontrado para esta implementação.
                <br />
                Crie o primeiro backup para proteger suas configurações.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => {
              const isExpired = backup.expires_at && new Date(backup.expires_at) < new Date();
              const isRestoring = restoring === backup.id;
              const isDeleting = deleting === backup.id;
              
              return (
                <Card key={backup.id} className={isExpired ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-muted rounded-md">
                          {getBackupTypeIcon(backup.backup_type)}
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getBackupTypeBadge(backup.backup_type)}
                            <span className="text-sm font-medium">
                              {backup.metadata?.description || 'Backup sem descrição'}
                            </span>
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Expirado
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(backup.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {formatBytes(backup.size_bytes)}
                            </span>
                            {backup.metadata?.version && (
                              <span className="flex items-center gap-1">
                                v{backup.metadata.version}
                              </span>
                            )}
                            {backup.metadata?.encrypted && (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Criptografado
                              </span>
                            )}
                          </div>
                          
                          {backup.expires_at && !isExpired && (
                            <p className="text-xs text-muted-foreground">
                              Expira {formatDistanceToNow(new Date(backup.expires_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBackup(backup);
                            setRestoreType(backup.backup_type === 'full' ? 'full' : 'config_only');
                            setRestoreDialogOpen(true);
                          }}
                          disabled={isExpired || isDeleting}
                          loading={isRestoring}
                        >
                          <Upload className="w-4 h-4" />
                          <span className="sr-only">Restaurar</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBackup(backup.id)}
                          disabled={isRestoring}
                          loading={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog de criação de backup */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Backup</DialogTitle>
            <DialogDescription>
              Crie um backup da implementação "{implementationName}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backupType">Tipo de Backup</Label>
              <Select
                value={backupType}
                onValueChange={(value: any) => setBackupType(value)}
              >
                <SelectTrigger id="backupType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      <span>Backup Completo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="incremental">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      <span>Backup Incremental</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="config_only">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>Apenas Configurações</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Descrição do tipo selecionado */}
              <p className="text-xs text-muted-foreground">
                {backupType === 'full' && 'Inclui implementação completa, configurações e assignments'}
                {backupType === 'incremental' && 'Apenas mudanças desde o último backup'}
                {backupType === 'config_only' && 'Apenas configurações e parâmetros da implementação'}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ex: Backup antes da atualização de versão"
                value={backupDescription}
                onChange={(e) => setBackupDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <p>
                  Os backups são armazenados de forma segura e expiram automaticamente 
                  após o período de retenção configurado.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateBackup}
              loading={creating}
              leftIcon={<Archive className="w-4 h-4" />}
            >
              Criar Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de restauração */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Backup</DialogTitle>
            <DialogDescription>
              Restaurar dados do backup selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedBackup && (
            <div className="space-y-4 py-4">
              <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5" />
                  <p>
                    <strong>Atenção:</strong> A restauração irá sobrescrever os dados atuais.
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Backup Selecionado</Label>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      {getBackupTypeBadge(selectedBackup.backup_type)}
                      <span className="text-sm font-medium">
                        {selectedBackup.metadata?.description || 'Backup sem descrição'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Criado {formatDistanceToNow(new Date(selectedBackup.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="restoreType">Tipo de Restauração</Label>
                <Select
                  value={restoreType}
                  onValueChange={(value: any) => setRestoreType(value)}
                  disabled={selectedBackup.backup_type === 'config_only'}
                >
                  <SelectTrigger id="restoreType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="full"
                      disabled={selectedBackup.backup_type !== 'full'}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span>Restauração Completa</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="config_only">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Apenas Configurações</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <p className="text-xs text-muted-foreground">
                  {restoreType === 'full' && 'Restaura todos os dados do backup'}
                  {restoreType === 'config_only' && 'Restaura apenas as configurações'}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(false);
                setSelectedBackup(null);
              }}
              disabled={!!restoring}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestoreBackup}
              loading={!!restoring}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Restaurar Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}