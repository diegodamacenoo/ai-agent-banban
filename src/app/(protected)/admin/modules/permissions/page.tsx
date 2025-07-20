'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PermissionManager } from '../components/configurations/PermissionManager';

export default function PermissionsPage() {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/admin/modules" className="hover:text-foreground">
              Módulos
            </Link>
            <span>/</span>
            <span>Permissões</span>
          </div>
          <h1 className="text-3xl font-bold">Gerenciamento de Permissões</h1>
          <p className="text-muted-foreground">
            Configure permissões granulares para módulos e funcionalidades
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/modules">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      {/* Informações sobre Permissões */}
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Permissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            O sistema de permissões permite controlar o acesso a módulos e funcionalidades
            de forma granular, baseado em papéis de usuário e configurações organizacionais.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🔐 Controles de Acesso</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Permissões por módulo individual</li>
                <li>• Controle de funcionalidades específicas</li>
                <li>• Hierarquia de papéis de usuário</li>
                <li>• Permissões temporárias</li>
                <li>• Aprovações de acesso</li>
                <li>• Auditoria de permissões</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">👥 Gestão de Papéis</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Papéis predefinidos (Admin, User, etc.)</li>
                <li>• Papéis customizados por organização</li>
                <li>• Herança de permissões</li>
                <li>• Delegação de autoridades</li>
                <li>• Revisão periódica de acessos</li>
                <li>• Workflow de aprovação</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente principal */}
      <PermissionManager />
    </div>
  );
}