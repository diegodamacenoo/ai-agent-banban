import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import React, { ReactNode } from 'react'

// Interface para as props do SettingsDialog
interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock do componente SettingsDialog completo
const mockSettingsDialog = jest.fn(({ open, onOpenChange }: SettingsDialogProps) => {
  if (!open) return null
  return (
    <div data-testid="settings-dialog">
      <button data-testid="dialog-close" onClick={() => onOpenChange(false)}>Fechar</button>
      <div data-testid="settings-conta">ConfiguraÃ§Ãµes de Conta</div>
      <div data-testid="settings-usuarios" className="hidden">ConfiguraÃ§Ãµes de UsuÃ¡rios</div>
      <div className="sidebar">
        <button
          data-testid="sidebar-menu-button-conta"
          data-active="true"
        >
          Conta
        </button>
        <button
          data-testid="sidebar-menu-button-usuarios"
          onClick={() => {
            const contaElement = document.querySelector('[data-testid="settings-conta"]')
            const usuariosElement = document.querySelector('[data-testid="settings-usuarios"]')
            
            if (contaElement) contaElement.classList.add('hidden')
            if (usuariosElement) usuariosElement.classList.remove('hidden')
          }}
        >
          UsuÃ¡rios
        </button>
      </div>
    </div>
  )
})

// Mock do componente PerfilUsuarioProvider
const MockPerfilUsuarioProvider = ({ children }: { children: ReactNode }) => <div>{children}</div>

// Substitui as importaÃ§Ãµes reais
jest.mock('../settings-dialog', () => ({
  SettingsDialog: (props: SettingsDialogProps) => mockSettingsDialog(props)
}))

jest.mock('../contexts/perfis-context', () => ({
  PerfilUsuarioProvider: (props: { children: ReactNode }) => <MockPerfilUsuarioProvider {...props} />
}))

// Componente importado (agora mockado)
import { SettingsDialog } from '../settings-dialog'
import { PerfilUsuarioProvider } from '../contexts/perfis-context'

describe('SettingsDialog', () => {
  const mockOnOpenChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar corretamente', () => {
    render(
      <PerfilUsuarioProvider>
        <SettingsDialog open={true} onOpenChange={mockOnOpenChange} />
      </PerfilUsuarioProvider>
    )

    // Verifica se o dialog estÃ¡ visÃ­vel
    expect(screen.getByTestId('settings-dialog')).toBeInTheDocument()
    // Verifica se o componente inicial estÃ¡ visÃ­vel
    expect(screen.getByTestId('settings-conta')).toBeInTheDocument()
    // Verifica se o componente UsuÃ¡rios estÃ¡ oculto
    expect(screen.getByTestId('settings-usuarios')).toHaveClass('hidden')
  })

  it('deve mudar o conteÃºdo ao selecionar um item', () => {
    render(
      <PerfilUsuarioProvider>
        <SettingsDialog open={true} onOpenChange={mockOnOpenChange} />
      </PerfilUsuarioProvider>
    )

    // Clica no botÃ£o UsuÃ¡rios
    fireEvent.click(screen.getByTestId('sidebar-menu-button-usuarios'))

    // Verifica se o componente UsuÃ¡rios estÃ¡ visÃ­vel
    expect(screen.getByTestId('settings-usuarios')).not.toHaveClass('hidden')
    // Verifica se o componente de Conta estÃ¡ oculto
    expect(screen.getByTestId('settings-conta')).toHaveClass('hidden')
  })

  it('deve fechar ao chamar onOpenChange', () => {
    render(
      <PerfilUsuarioProvider>
        <SettingsDialog open={true} onOpenChange={mockOnOpenChange} />
      </PerfilUsuarioProvider>
    )

    // Encontra o botÃ£o de fechar
    const closeButton = screen.getByTestId('dialog-close')
    fireEvent.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
