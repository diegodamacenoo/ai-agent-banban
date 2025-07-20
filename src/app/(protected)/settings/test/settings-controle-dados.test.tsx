import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsControleDados from '../components/settings-controle-dados'
import React, { ReactNode, ChangeEvent } from 'react'

// Interfaces para as props dos subcomponentes
interface ExportacaoDadosProps {
  formatoExportacao: string;
  setFormatoExportacao: (formato: string) => void;
}

interface CorrecaoDadosProps {
  tipoSolicitacao: string;
  setTipoSolicitacao: (tipo: string) => void;
  descricaoSolicitacao: string;
  setDescricaoSolicitacao: (descricao: string) => void;
}

interface AnonimizacaoExclusaoProps {
  tipoExclusao: string;
  setTipoExclusao: (tipo: string) => void;
}

interface PeriodoRetencaoProps {
  periodoRetencao: string;
  setPeriodoRetencao: (periodo: string) => void;
}

interface BackupsCriptografadosProps {
  formatoBackup: string;
  setFormatoBackup: (formato: string) => void;
}

interface HistoricoConsentimentosProps {
  logsConsentimento: Array<{
    tipo: string;
    data: string;
    ip: string;
    dispositivo: string;
  }>;
}

// Mock dos subcomponentes
jest.mock('../components/controle-dados-components/exportacao-dados', () => ({
  ExportacaoDados: ({ formatoExportacao, setFormatoExportacao }: ExportacaoDadosProps) => (
    <div data-testid="exportacao-dados-mock">
      <button onClick={() => setFormatoExportacao('csv')} data-testid="change-format-btn">Mudar Formato</button>
      <span>Formato atual: {formatoExportacao}</span>
    </div>
  ),
}))

jest.mock('../components/controle-dados-components/correcao-dados', () => ({
  CorrecaoDados: ({ tipoSolicitacao, setTipoSolicitacao, descricaoSolicitacao, setDescricaoSolicitacao }: CorrecaoDadosProps) => (
    <div data-testid="correcao-dados-mock">
      <button onClick={() => setTipoSolicitacao('outro')} data-testid="change-tipo-btn">Mudar Tipo</button>
      <input 
        data-testid="descricao-input" 
        value={descricaoSolicitacao} 
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDescricaoSolicitacao(e.target.value)} 
      />
    </div>
  ),
}))

jest.mock('../components/controle-dados-components/anonimizacao-exclusao', () => ({
  AnonimizacaoExclusao: ({ tipoExclusao, setTipoExclusao }: AnonimizacaoExclusaoProps) => (
    <div data-testid="anonimizacao-exclusao-mock">
      <span>Tipo atual: {tipoExclusao}</span>
      <button onClick={() => setTipoExclusao('exclusao')} data-testid="change-exclusao-btn">Mudar para ExclusÃ£o</button>
    </div>
  ),
}))

jest.mock('../components/controle-dados-components/periodo-retencao', () => ({
  PeriodoRetencao: ({ periodoRetencao, setPeriodoRetencao }: PeriodoRetencaoProps) => (
    <div data-testid="periodo-retencao-mock">
      <span>PerÃ­odo atual: {periodoRetencao}</span>
      <button onClick={() => setPeriodoRetencao('730')} data-testid="change-periodo-btn">Mudar PerÃ­odo</button>
    </div>
  ),
}))

jest.mock('../components/controle-dados-components/backups-criptografados', () => ({
  BackupsCriptografados: ({ formatoBackup, setFormatoBackup }: BackupsCriptografadosProps) => (
    <div data-testid="backups-criptografados-mock">
      <span>Formato atual: {formatoBackup}</span>
      <button onClick={() => setFormatoBackup('csv')} data-testid="change-backup-btn">Mudar Formato</button>
    </div>
  ),
}))

jest.mock('../components/controle-dados-components/historico-consentimentos', () => ({
  HistoricoConsentimentos: ({ logsConsentimento }: HistoricoConsentimentosProps) => (
    <div data-testid="historico-consentimentos-mock">
      Logs: {logsConsentimento.length}
    </div>
  ),
}))

// Mock de componentes UI e Ã­cones
jest.mock('@/shared/ui/button', () => ({
  Button: ({ children, ...props }: { children: ReactNode; [key: string]: any }) => <button {...props}>{children}</button>,
}))

jest.mock('lucide-react', () => ({
  SaveIcon: () => <svg data-testid="save-icon"></svg>,
}))

describe('SettingsControleDados', () => {
  it('deve renderizar o cabeÃ§alho e os tÃ­tulos das seÃ§Ãµes corretamente', () => {
    render(<SettingsControleDados />)

    expect(screen.getByRole('heading', { name: /Controle de Dados/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Exportar Dados Pessoais/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Solicitar CorreÃ§Ã£o de Dados/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Solicitar AnonimizaÃ§Ã£o ou ExclusÃ£o/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /PerÃ­odo de RetenÃ§Ã£o AutomÃ¡tica/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Download de Backups Criptografados/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /HistÃ³rico de Consentimentos/i, level: 3 })).toBeInTheDocument()
  })

  it('deve renderizar os subcomponentes mockados', () => {
    render(<SettingsControleDados />)

    expect(screen.getByTestId('exportacao-dados-mock')).toBeInTheDocument()
    expect(screen.getByTestId('correcao-dados-mock')).toBeInTheDocument()
    expect(screen.getByTestId('anonimizacao-exclusao-mock')).toBeInTheDocument()
    expect(screen.getByTestId('periodo-retencao-mock')).toBeInTheDocument()
    expect(screen.getByTestId('backups-criptografados-mock')).toBeInTheDocument()
    expect(screen.getByTestId('historico-consentimentos-mock')).toBeInTheDocument()
  })

  it('deve renderizar botÃ£o de salvar para seÃ§Ã£o de PerÃ­odo de RetenÃ§Ã£o', () => {
    render(<SettingsControleDados />)
    
    const saveButton = screen.getByRole('button', { name: /Salvar/i })
    expect(saveButton).toBeInTheDocument()
    expect(saveButton.closest('div')?.textContent).toContain('PerÃ­odo de RetenÃ§Ã£o')
  })

  it('deve alterar o estado formatoExportacao ao clicar no botÃ£o', () => {
    render(<SettingsControleDados />)
    
    const changeFormatBtn = screen.getByTestId('change-format-btn')
    fireEvent.click(changeFormatBtn)
    
    // Verificar se o formato foi alterado
    expect(screen.getByText(/Formato atual: csv/i)).toBeInTheDocument()
  })

  it('deve alterar o tipo de exclusÃ£o ao clicar no botÃ£o', () => {
    render(<SettingsControleDados />)
    
    const changeExclusaoBtn = screen.getByTestId('change-exclusao-btn')
    fireEvent.click(changeExclusaoBtn)
    
    // Verificar se o tipo de exclusÃ£o foi alterado
    expect(screen.getByText(/Tipo atual: exclusao/i)).toBeInTheDocument()
  })
}) 
