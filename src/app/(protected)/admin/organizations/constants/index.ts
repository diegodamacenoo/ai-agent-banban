// ============================================
// CONSTANTS
// ============================================

import React from 'react';
import { BarChart3, Building2, Users, CheckCircle, Settings } from 'lucide-react';

/**
 * Configuração das abas da interface
 * Define estrutura de navegação principal
 */
export const TAB_ITEMS = [
  { id: 'overview', label: 'Overview', icon: React.createElement(BarChart3, { className: "w-4 h-4" }) },
  { id: 'organizations', label: 'Organizações', icon: React.createElement(Building2, { className: "w-4 h-4" }) },
  { id: 'users', label: 'Usuários', icon: React.createElement(Users, { className: "w-4 h-4" }) },
  { id: 'approvals', label: 'Aprovações', icon: React.createElement(CheckCircle, { className: "w-4 h-4" }) },
  { id: 'settings', label: 'Configurações', icon: React.createElement(Settings, { className: "w-4 h-4" }) },
] as const;

/**
 * Delay para otimização de busca em tempo real
 */
export const DEBOUNCE_DELAY = 300;