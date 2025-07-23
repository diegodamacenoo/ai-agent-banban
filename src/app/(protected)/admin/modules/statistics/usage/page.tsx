'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Users, BarChart3, Activity } from 'lucide-react';
import { Layout } from '@/shared/components/Layout';
import Link from 'next/link';

export default function UsoPage() {
  return (
    <Layout>
      <Layout.Header>
        <Layout.Breadcrumbs items={[
          { title: 'Admin' },
          { title: 'Módulos', href: '/admin/modules' },
          { title: 'Estatísticas', href: '/admin/modules/estatisticas' },
          { title: 'Analytics de Uso' }
        ]} />
        <Layout.Actions>
          <Button variant="outline" asChild>
            <Link href="/admin/modules/estatisticas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar às Estatísticas
            </Link>
          </Button>
        </Layout.Actions>
      </Layout.Header>

      <Layout.Body>
        <Layout.Content>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Analytics de Uso</h1>
                <p className="text-muted-foreground">
                  Padrões de adoção e comportamento de uso dos módulos
                </p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Analytics de Adoção</CardTitle>
              <CardDescription>
                Esta seção será implementada com analytics detalhadas de uso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Em Desenvolvimento</h3>
                <p className="text-muted-foreground mb-4">
                  Analytics de uso serão implementadas em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
}