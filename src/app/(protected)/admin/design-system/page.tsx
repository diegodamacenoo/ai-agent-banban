'use client';

import { Layout } from '@/shared/components/Layout';
import { DesignSystemSection } from './components/DesignSystemSection';
import {
  TypographySection,
  ColorsSection,
  ButtonsSection,
  BadgesSection,
  AlertsSection,
  FormsSection,
  TablesSection,
  ToastSection
} from './components/sections';
import {
  Palette,
  Type,
  Component
} from 'lucide-react';


export default function DesignSystemPage() {

  return (
    <Layout>
      <Layout.Header>
        <h1 className="text-2xl font-bold text-gray-900">Design System</h1>
        <p className="text-sm text-gray-600 mt-1">
          Guia de referência para componentes, cores e tipografia do painel Admin Master.
        </p>
      </Layout.Header>
      <Layout.Content className="space-y-12 p-4 md:p-6">
        <DesignSystemSection id="typography" title="Tipografia" icon={Type}>
          <TypographySection />
        </DesignSystemSection>

        <DesignSystemSection id="colors" title="Cores" icon={Palette}>
          <ColorsSection />
        </DesignSystemSection>

        <DesignSystemSection id="components" title="Componentes" icon={Component}>
          <div className="space-y-8">
            <ButtonsSection />

            <BadgesSection />

            <AlertsSection />

            <FormsSection />

            <TablesSection />

          </div>
        </DesignSystemSection>
      </Layout.Content>
    </Layout>
  );
}


