'use client';

import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { UserX, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface TerminateSessionDialogProps {
  children: React.ReactNode;
  onConfirm: () => void;
  userName: string;
}

export function TerminateSessionDialog({ 
  children, 
  onConfirm, 
  userName
}: TerminateSessionDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-red-500" />
            Encerrar sessão
          </DialogTitle>
          <DialogDescription>
            Esta ação encerrará a sessão ativa do usuário <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-3">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">O que acontecerá:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800 dark:text-red-200">
                <li>A sessão será encerrada imediatamente</li>
                <li>O usuário será redirecionado para o login</li>
                <li>Um registro de auditoria será criado</li>
                <li>O usuário receberá uma notificação sobre o encerramento</li>
              </ul>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  O usuário poderá fazer login novamente imediatamente após o encerramento.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onConfirm} variant="destructive">
            Encerrar Sessão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}