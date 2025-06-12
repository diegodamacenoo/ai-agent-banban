import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsConta from '../components/settings-conta'
import React, { ReactNode } from 'react'

// Mock dos subcomponentes
jest.mock('../components/conta-components/dados-pessoais', () => ({
  __esModule: true,
  default: () => <div data-testid="dados-pessoais-mock">Dados Pessoais Mock</div>,
}))
jest.mock('../components/conta-components/credenciais', () => ({
  __esModule: true,
  default: () => <div data-testid="credenciais-mock">Credenciais Mock</div>,
}))
jest.mock('../components/conta-components/autenticacao-dois-fatores', () => ({
  __esModule: true,
  default: () => <div data-testid="autenticacao-dois-fatores-mock">Autenticação Mock</div>,
}))
jest.mock('../components/conta-components/preferencias-interface', () => ({
  __esModule: true,
  default: () => <div data-testid="preferencias-interface-mock">Preferências Mock</div>,
}))
jest.mock('../components/conta-components/sessoes-atividade', () => ({
  __esModule: true,
  default: () => <div data-testid="sessoes-atividade-mock">Sessões Mock</div>,
}))
jest.mock('../components/conta-components/fluxos-auxiliares', () => ({
  __esModule: true,
  default: () => <div data-testid="fluxos-auxiliares-mock">Fluxos Auxiliares Mock</div>,
}))

// Mock de componentes UI e ícones
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: ReactNode; [key: string]: any }) => <button {...props}>{children}</button>,
}))
jest.mock('lucide-react', () => ({
  SaveIcon: () => <svg data-testid="save-icon"></svg>,
}))

describe('SettingsConta', () => {
  it('deve renderizar o cabeçalho e os títulos das seções corretamente', () => {
    render(<SettingsConta />)

    expect(screen.getByRole('heading', { name: /Conta/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Dados Pessoais/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Credenciais/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Autenticação em Dois Fatores \(2FA\)/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Preferências de Interface/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Sessões e Atividade/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Ações da Conta/i, level: 3 })).toBeInTheDocument()
  })

  it('deve renderizar os subcomponentes mockados', () => {
    render(<SettingsConta />)

    expect(screen.getByTestId('dados-pessoais-mock')).toBeInTheDocument()
    expect(screen.getByTestId('credenciais-mock')).toBeInTheDocument()
    expect(screen.getByTestId('autenticacao-dois-fatores-mock')).toBeInTheDocument()
    expect(screen.getByTestId('preferencias-interface-mock')).toBeInTheDocument()
    expect(screen.getByTestId('sessoes-atividade-mock')).toBeInTheDocument()
    expect(screen.getByTestId('fluxos-auxiliares-mock')).toBeInTheDocument()
  })

  it('deve renderizar botões de salvar para seções aplicáveis', () => {
    render(<SettingsConta />)
    // Exemplo: Autenticação em Dois Fatores e Preferências de Interface têm botões Salvar
    const saveButtons = screen.getAllByRole('button', { name: /Salvar/i })
    expect(saveButtons.length).toBeGreaterThanOrEqual(2) // Pelo menos 2 botões de salvar
    saveButtons.forEach(button => {
      expect(button).toBeInTheDocument()
    })
  })
}) 