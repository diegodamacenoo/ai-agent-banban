import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsNotificacoes from '../components/settings-notificacoes'
import React, { ReactNode } from 'react'

// Mock dos subcomponentes
jest.mock('../components/notificacoes-components/preferencias-individuais', () => ({
  __esModule: true,
  PreferenciasIndividuais: () => <div data-testid="preferencias-individuais-mock">PreferÃªncias Individuais Mock</div>,
}))
jest.mock('../components/notificacoes-components/canais-disponiveis', () => ({
  __esModule: true,
  CanaisDisponiveis: () => <div data-testid="canais-disponiveis-mock">Canais DisponÃ­veis Mock</div>,
}))
jest.mock('../components/notificacoes-components/tipos-alertas', () => ({
  __esModule: true,
  TiposAlertas: () => <div data-testid="tipos-alertas-mock">Tipos de Alertas Mock</div>,
}))
jest.mock('../components/notificacoes-components/configuracoes-gerais', () => ({
  __esModule: true,
  ConfiguracoesGeraisNotificacoes: () => <div data-testid="configuracoes-gerais-mock">ConfiguraÃ§Ãµes Gerais Mock</div>,
}))
jest.mock('../components/notificacoes-components/escopo-silenciamento', () => ({
  __esModule: true,
  EscopoSilenciamento: () => <div data-testid="escopo-silenciamento-mock">Escopo de Silenciamento Mock</div>,
}))
jest.mock('../components/notificacoes-components/historico-notificacoes', () => ({
  __esModule: true,
  HistoricoNotificacoes: () => <div data-testid="historico-notificacoes-mock">HistÃ³rico de NotificaÃ§Ãµes Mock</div>,
}))

// Mock de componentes UI e Ã­cones
jest.mock('@/shared/ui/button', () => ({
  Button: ({ children, ...props }: { children: ReactNode; [key: string]: any }) => <button {...props}>{children}</button>,
}))
jest.mock('lucide-react', () => ({
  SaveIcon: () => <svg data-testid="save-icon"></svg>,
}))

describe('SettingsNotificacoes', () => {
  it('deve renderizar o cabeÃ§alho e os tÃ­tulos das seÃ§Ãµes corretamente', () => {
    render(<SettingsNotificacoes />)

    expect(screen.getByRole('heading', { name: /NotificaÃ§Ãµes/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /PreferÃªncias Individuais/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Canais DisponÃ­veis/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Tipos de Alertas/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /ConfiguraÃ§Ãµes Gerais/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Escopo de Silenciamento/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /HistÃ³rico de NotificaÃ§Ãµes/i, level: 3 })).toBeInTheDocument()
  })

  it('deve renderizar os subcomponentes mockados', () => {
    render(<SettingsNotificacoes />)

    expect(screen.getByTestId('preferencias-individuais-mock')).toBeInTheDocument()
    expect(screen.getByTestId('canais-disponiveis-mock')).toBeInTheDocument()
    expect(screen.getByTestId('tipos-alertas-mock')).toBeInTheDocument()
    expect(screen.getByTestId('configuracoes-gerais-mock')).toBeInTheDocument()
    expect(screen.getByTestId('escopo-silenciamento-mock')).toBeInTheDocument()
    expect(screen.getByTestId('historico-notificacoes-mock')).toBeInTheDocument()
  })

  it('deve renderizar botÃµes de salvar para seÃ§Ãµes aplicÃ¡veis', () => {
    render(<SettingsNotificacoes />)
    const saveButtons = screen.getAllByRole('button', { name: /Salvar/i })
    // PreferÃªncias Individuais, Canais DisponÃ­veis, ConfiguraÃ§Ãµes Gerais, Escopo de Silenciamento
    expect(saveButtons.length).toBeGreaterThanOrEqual(4)
    saveButtons.forEach(button => {
      expect(button).toBeInTheDocument()
    })
  })
}) 
