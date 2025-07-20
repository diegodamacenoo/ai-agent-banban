'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { 
  getLogger, 
  LogLevel, 
  LoggerConfig 
} from '@/shared/utils/logger';
import { BugIcon } from 'lucide-react';

// Tipo para um item de log
interface LogItem {
  timestamp: string;
  level: LogLevel;
  module?: string;
  message: string;
}

export const DebugController = () => {
  const [config, setConfig] = useState<LoggerConfig | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  
  // Carregar configuraÃ§Ã£o ao montar o componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const logger = getLogger();
      setConfig(logger.getConfig());
      updateLogs();
      
      // Extrair mÃ³dulos Ãºnicos dos logs
      const logEntries = logger.getLogs();
      const uniqueModules = Array.from(
        new Set(logEntries.map((log: LogItem) => log.module).filter(Boolean))
      ) as string[];
      
      setModules(uniqueModules);
    }
  }, [open]);
  
  // FunÃ§Ã£o para atualizar logs
  const updateLogs = () => {
    const logger = getLogger();
    setLogs(logger.getLogs());
  };
  
  // FunÃ§Ã£o para ativar/desativar logger
  const handleToggleEnabled = (enabled: boolean) => {
    const logger = getLogger();
    logger.enable(enabled);
    setConfig(logger.getConfig());
  };
  
  // FunÃ§Ã£o para mudar nÃ­vel de log
  const handleLevelChange = (level: LogLevel) => {
    const logger = getLogger();
    logger.setLevel(level);
    setConfig(logger.getConfig());
  };
  
  // FunÃ§Ã£o para ativar/desativar logs de um mÃ³dulo
  const handleModuleToggle = (module: string, enabled: boolean) => {
    const logger = getLogger();
    logger.enableModule(module, enabled);
    setConfig(logger.getConfig());
  };
  
  // FunÃ§Ã£o para ativar/desativar destinos de log
  const handleTargetToggle = (target: keyof LoggerConfig['targets'], enabled: boolean) => {
    const logger = getLogger();
    logger.setTargets({ [target]: enabled });
    setConfig(logger.getConfig());
  };
  
  // FunÃ§Ã£o para limpar logs
  const handleClearLogs = () => {
    const logger = getLogger();
    logger.clearLogs();
    setLogs([]);
  };
  
  // FunÃ§Ã£o para resetar configuraÃ§Ã£o
  const handleResetConfig = () => {
    const logger = getLogger();
    logger.resetConfig();
    setConfig(logger.getConfig());
  };
  
  // RenderizaÃ§Ã£o condicional enquanto carrega
  if (!config) {
    return null;
  }
  
  // Cores para nÃ­veis de log
  const logLevelColors: Record<LogLevel, string> = {
    error: 'text-red-500',
    warn: 'text-yellow-500',
    info: 'text-blue-500',
    debug: 'text-green-500',
    trace: 'text-gray-500'
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 rounded-full"
          title="Controlador de Debug"
        >
          <BugIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Controlador de Debug</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="config">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="config">
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-enabled">Ativar logs</Label>
                <Switch
                  id="debug-enabled"
                  checked={config.enabled}
                  onCheckedChange={handleToggleEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-level">Nível de log</Label>
                <Select
                  value={config.level}
                  onValueChange={(value) => handleLevelChange(value as LogLevel)}
                  disabled={!config.enabled}
                >
                  <SelectTrigger className="w-[180px]" id="debug-level">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="trace">Trace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-console">Log no console</Label>
                <Switch
                  id="debug-console"
                  checked={config.targets.console}
                  onCheckedChange={(checked) => handleTargetToggle('console', checked)}
                  disabled={!config.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="debug-localstorage">Armazenar logs (localStorage)</Label>
                <Switch
                  id="debug-localstorage"
                  checked={config.targets.localStorage}
                  onCheckedChange={(checked) => handleTargetToggle('localStorage', checked)}
                  disabled={!config.enabled}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleResetConfig}>
                  Resetar configuração
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="modules">
            <div className="space-y-4 py-2">
              {modules.length > 0 ? (
                modules.map((module) => (
                  <div key={module} className="flex items-center justify-between">
                    <Label htmlFor={`module-${module}`}>{module}</Label>
                    <Switch
                      id={`module-${module}`}
                      checked={config.modules[module] !== false}
                      onCheckedChange={(checked) => handleModuleToggle(module, checked)}
                      disabled={!config.enabled}
                    />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum módulo encontrado nos logs.
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="py-2">
              <div className="flex justify-end space-x-2 mb-4">
                <Button variant="outline" onClick={updateLogs}>
                  Atualizar
                </Button>
                <Button variant="outline" onClick={handleClearLogs}>
                  Limpar logs
                </Button>
              </div>
              
              {logs.length > 0 ? (
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Timestamp</TableHead>
                        <TableHead className="w-[80px]">Nível</TableHead>
                        <TableHead className="w-[100px]">Módulo</TableHead>
                        <TableHead>Mensagem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className={logLevelColors[log.level]}>
                            {log.level}
                          </TableCell>
                          <TableCell>{log.module || '-'}</TableCell>
                          <TableCell className="font-mono text-xs whitespace-pre-wrap">
                            {log.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum log armazenado.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}; 
