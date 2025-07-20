import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import React, { ReactNode } from 'react'
import SettingsSeguranca from '../components/settings-seguranca'

// Verifica se o componente existe
console.log('SettingsSeguranca component:', SettingsSeguranca)

// Tipos para os mocks
interface PoliticaSenhaProps {
  comprimentoMinimo: number;
  setComprimentoMinimo: (valor: number) => void;
  forcaSenha: string;
  setForcaSenha: (valor: string) => void;
  bloqueioTentativas: number;
  setBloqueioTentativas: (valor: number) => void;
  validadeSenha: number;
  setValidadeSenha: (valor: number) => void;
  senhaExemplo: string;
  mostrarSenha: boolean;
  setMostrarSenha: (valor: boolean) => void;
}

interface AutenticacaoDoisFatoresProps {
  ativar2FA: boolean;
  setAtivar2FA: (valor: boolean) => void;
  obrigatorio2FA: boolean;
  setObrigatorio2FA: (valor: boolean) => void;
  metodo2FA: string;
  setMetodo2FA: (valor: string) => void;
}

interface TempoInatividadeProps {
  tempoInatividade: string;
  setTempoInatividade: (valor: string) => void;
}

interface RestricoesIPProps {
  restricaoIP: boolean;
  setRestricaoIP: (valor: boolean) => void;
  novoIP: string;
  setNovoIP: (valor: string) => void;
  listaIPs: string[];
  adicionarIP: () => void;
  removerIP: (ip: string) => void;
}

interface ChavesWebhookProps {
  chaveWebhook: string;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  ultimoUsoWebhook: string;
  gerarNovaChaveWebhook: () => void;
  testarWebhook: () => void;
  copyToClipboard: (valor: string) => void;
}

interface LogsAuditoriaProps {
  filtroData: string;
  setFiltroData: (valor: string) => void;
  filtroUsuario: string;
  setFiltroUsuario: (valor: string) => void;
  filtroAcao: string;
  setFiltroAcao: (valor: string) => void;
  filtroIP: string;
  setFiltroIP: (valor: string) => void;
  logsAuditoria: Array<{
    id: string;
    usuario: string;
    acao: string;
    data: string;
    ip: string;
    dispositivo: string;
  }>;
  filtrarLogs: () => void;
}

interface AlertasSegurancaProps {
  alertaNovoDispositivo: boolean;
  setAlertaNovoDispositivo: (valor: boolean) => void;
  alertaTentativasFalhas: boolean;
  setAlertaTentativasFalhas: (valor: boolean) => void;
  alertaCriacaoToken: boolean;
  setAlertaCriacaoToken: (valor: boolean) => void;
  alertaExclusaoUsuario: boolean;
  setAlertaExclusaoUsuario: (valor: boolean) => void;
}

// Mocks dos subcomponentes
jest.mock('../components/seguranca-components/politica-senha', () => ({
  __esModule: true,
  default: (props: PoliticaSenhaProps) => (
    <div data-testid="politica-senha-mock">
      <div>Comprimento MÃ­nimo: {props.comprimentoMinimo}</div>
      <button onClick={() => props.setComprimentoMinimo(10)} data-testid="aumentar-comprimento-btn">
        Aumentar Comprimento
      </button>
      <div>ForÃ§a Senha: {props.forcaSenha}</div>
      <button onClick={() => props.setForcaSenha('forte')} data-testid="alterar-forca-btn">
        Definir ForÃ§a como Forte
      </button>
    </div>
  ),
}))

jest.mock('../components/seguranca-components/autenticacao-dois-fatores', () => ({
  __esModule: true,
  default: (props: AutenticacaoDoisFatoresProps) => (
    <div data-testid="autenticacao-dois-fatores-mock">
      <div>2FA Ativado: {props.ativar2FA ? 'Sim' : 'NÃ£o'}</div>
      <button onClick={() => props.setAtivar2FA(!props.ativar2FA)} data-testid="toggle-2fa-btn">
        {props.ativar2FA ? 'Desativar 2FA' : 'Ativar 2FA'}
      </button>
    </div>
  ),
}))

jest.mock('../components/seguranca-components/tempo-inatividade', () => ({
  __esModule: true,
  default: (props: TempoInatividadeProps) => (
    <div data-testid="tempo-inatividade-mock">
      <div>Tempo de Inatividade: {props.tempoInatividade} minutos</div>
      <button onClick={() => props.setTempoInatividade('60')} data-testid="alterar-tempo-btn">
        Definir 60 minutos
      </button>
    </div>
  ),
}))

jest.mock('../components/seguranca-components/restricoes-ip', () => ({
  __esModule: true,
  default: (props: RestricoesIPProps) => (
    <div data-testid="restricoes-ip-mock">
      <div>RestriÃ§Ã£o IP: {props.restricaoIP ? 'Ativada' : 'Desativada'}</div>
      <button onClick={() => props.setRestricaoIP(!props.restricaoIP)} data-testid="toggle-restricao-btn">
        {props.restricaoIP ? 'Desativar RestriÃ§Ã£o' : 'Ativar RestriÃ§Ã£o'}
      </button>
      <div>IPs: {props.listaIPs.join(', ')}</div>
      <input 
        data-testid="novo-ip-input" 
        value={props.novoIP} 
        onChange={(e) => props.setNovoIP(e.target.value)}
      />
      <button onClick={props.adicionarIP} data-testid="adicionar-ip-btn">Adicionar IP</button>
    </div>
  ),
}))

jest.mock('../components/seguranca-components/chaves-webhook', () => ({
  __esModule: true,
  default: (props: ChavesWebhookProps) => (
    <div data-testid="chaves-webhook-mock">
      <div>Chave Atual: {props.chaveWebhook}</div>
      <button onClick={props.gerarNovaChaveWebhook} data-testid="gerar-chave-btn">Gerar Nova Chave</button>
      <button onClick={() => props.copyToClipboard(props.chaveWebhook)} data-testid="copiar-chave-btn">
        Copiar Chave
      </button>
      <button onClick={props.testarWebhook} data-testid="testar-webhook-btn">
        Testar Webhook
      </button>
    </div>
  ),
}))

jest.mock('../components/seguranca-components/logs-auditoria', () => ({
  __esModule: true,
  default: (props: LogsAuditoriaProps) => (
    <div data-testid="logs-auditoria-mock">
      <div>Total de Logs: {props.logsAuditoria.length}</div>
      <button onClick={props.filtrarLogs} data-testid="filtrar-logs-btn">Filtrar Logs</button>
    </div>
  ),
}))

jest.mock('../components/seguranca-components/alertas-seguranca', () => ({
  __esModule: true,
  default: (props: AlertasSegurancaProps) => (
    <div data-testid="alertas-seguranca-mock">
      <div>Alertas Novo Dispositivo: {props.alertaNovoDispositivo ? 'Sim' : 'NÃ£o'}</div>
      <button 
        onClick={() => props.setAlertaNovoDispositivo(!props.alertaNovoDispositivo)} 
        data-testid="toggle-alerta-dispositivo-btn"
      >
        Alternar Alerta
      </button>
    </div>
  ),
}))

// Mock dos componentes UI
jest.mock('@/shared/ui/card', () => ({
  Card: ({ className, children }: { className?: string; children: ReactNode }) => 
    <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ className, children }: { className?: string; children: ReactNode }) => 
    <div data-testid="card-content" className={className}>{children}</div>,
}))

jest.mock('@/shared/ui/button', () => ({
  Button: ({ 
    size, 
    variant, 
    className, 
    children, 
    onClick, 
    disabled 
  }: { 
    size?: string; 
    variant?: string; 
    className?: string; 
    children: ReactNode; 
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button 
      data-testid="button" 
      data-size={size} 
      data-variant={variant} 
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/shared/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: { children: ReactNode }) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div data-testid="dialog-footer">{children}</div>,
}))

jest.mock('@/shared/ui/input', () => ({
  Input: ({ id, placeholder, value, onChange, type }: { id: string; placeholder?: string; value: string; onChange: (e: any) => void; type?: string }) => (
    <input 
      data-testid={`input-${id}`}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      type={type || 'text'}
    />
  ),
}))

jest.mock('@/shared/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value: string; onValueChange: (value: string) => void; children: ReactNode }) => (
    <div data-testid="select" data-value={value}>
      {children}
      <select 
        data-testid="select-native" 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)}
      >
        <option value="leitura">Somente leitura</option>
        <option value="escrita">Leitura e escrita</option>
        <option value="completo">Acesso completo</option>
      </select>
    </div>
  ),
  SelectTrigger: ({ id, children }: { id: string; children: ReactNode }) => (
    <div data-testid={`select-trigger-${id}`}>{children}</div>
  ),
  SelectValue: () => <div data-testid="select-value"></div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <div data-testid={`select-item-${value}`} data-value={value}>{children}</div>
  ),
}))

jest.mock('@/shared/ui/label', () => ({
  Label: ({ htmlFor, children }: { htmlFor: string; children: ReactNode }) => (
    <label data-testid={`label-${htmlFor}`} htmlFor={htmlFor}>{children}</label>
  ),
}))

jest.mock('@/shared/ui/table', () => ({
  Table: ({ children }: { children: ReactNode }) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: { children: ReactNode }) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }: { children: ReactNode }) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }: { children: ReactNode }) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }: { children: ReactNode }) => <th data-testid="table-head">{children}</th>,
  TableCell: ({ children }: { children: ReactNode }) => <td data-testid="table-cell">{children}</td>,
}))

jest.mock('@/shared/ui/badge', () => ({
  Badge: ({ className, children }: { className?: string; children: ReactNode }) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}))

jest.mock('lucide-react', () => ({
  SaveIcon: () => <span data-testid="save-icon">SaveIcon</span>,
  KeyIcon: () => <span data-testid="key-icon">KeyIcon</span>,
  TrashIcon: () => <span data-testid="trash-icon">TrashIcon</span>,
  AlertTriangleIcon: () => <span data-testid="alert-triangle-icon">AlertTriangleIcon</span>,
  CopyIcon: () => <span data-testid="copy-icon">CopyIcon</span>,
  EyeIcon: () => <span data-testid="eye-icon">EyeIcon</span>,
  EyeOffIcon: () => <span data-testid="eye-off-icon">EyeOffIcon</span>,
  PlusIcon: () => <span data-testid="plus-icon">PlusIcon</span>,
  RefreshCwIcon: () => <span data-testid="refresh-cw-icon">RefreshCwIcon</span>,
  BellIcon: () => <span data-testid="bell-icon">BellIcon</span>,
  ShieldIcon: () => <span data-testid="shield-icon">ShieldIcon</span>,
  LockIcon: () => <span data-testid="lock-icon">LockIcon</span>,
  ClockIcon: () => <span data-testid="clock-icon">ClockIcon</span>,
  GlobeIcon: () => <span data-testid="globe-icon">GlobeIcon</span>,
  KeySquareIcon: () => <span data-testid="key-square-icon">KeySquareIcon</span>,
  WebhookIcon: () => <span data-testid="webhook-icon">WebhookIcon</span>,
  ClipboardListIcon: () => <span data-testid="clipboard-list-icon">ClipboardListIcon</span>,
  InfoIcon: () => <span data-testid="info-icon">InfoIcon</span>,
  CheckIcon: () => <span data-testid="check-icon">CheckIcon</span>,
  XIcon: () => <span data-testid="x-icon">XIcon</span>,
  SendIcon: () => <span data-testid="send-icon">SendIcon</span>,
  FilterIcon: () => <span data-testid="filter-icon">FilterIcon</span>,
  SearchIcon: () => <span data-testid="search-icon">SearchIcon</span>,
  CalendarIcon: () => <span data-testid="calendar-icon">CalendarIcon</span>,
}))

// Mock da funÃ§Ã£o clipboard
const mockCopyToClipboard = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockCopyToClipboard
  }
});

describe('SettingsSeguranca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Espiar a funÃ§Ã£o global window.alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restaurar todos os mocks, incluindo window.alert
  });

  it('deve renderizar o cabeÃ§alho e todos os tÃ­tulos de seÃ§Ã£o corretamente', () => {
    render(<SettingsSeguranca />);

    expect(screen.getByRole('heading', { name: /SeguranÃ§a/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /PolÃ­tica de Senha/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /AutenticaÃ§Ã£o em Dois Fatores/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Tempo MÃ¡ximo de Inatividade/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /RestriÃ§Ãµes de IP/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Gerenciamento de Tokens API/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Chaves de Webhook/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Logs de Auditoria/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Alertas de SeguranÃ§a/i, level: 3 })).toBeInTheDocument();
  });

  it('deve renderizar todos os subcomponentes mockados', () => {
    render(<SettingsSeguranca />);

    expect(screen.getByTestId('politica-senha-mock')).toBeInTheDocument();
    expect(screen.getByTestId('autenticacao-dois-fatores-mock')).toBeInTheDocument();
    expect(screen.getByTestId('tempo-inatividade-mock')).toBeInTheDocument();
    expect(screen.getByTestId('restricoes-ip-mock')).toBeInTheDocument();
    expect(screen.getByTestId('chaves-webhook-mock')).toBeInTheDocument();
    expect(screen.getByTestId('logs-auditoria-mock')).toBeInTheDocument();
    expect(screen.getByTestId('alertas-seguranca-mock')).toBeInTheDocument();
  });

  it('deve alterar o estado da polÃ­tica de senha quando os botÃµes sÃ£o clicados', () => {
    render(<SettingsSeguranca />);

    const aumentarComprimentoBtn = screen.getByTestId('aumentar-comprimento-btn');
    fireEvent.click(aumentarComprimentoBtn);
    expect(screen.getByText('Comprimento MÃ­nimo: 10')).toBeInTheDocument();

    const alterarForcaBtn = screen.getByTestId('alterar-forca-btn');
    fireEvent.click(alterarForcaBtn);
    expect(screen.getByText('ForÃ§a Senha: forte')).toBeInTheDocument();
  });

  it('deve alternar o estado de 2FA quando o botÃ£o Ã© clicado', () => {
    render(<SettingsSeguranca />);

    expect(screen.getByText('2FA Ativado: NÃ£o')).toBeInTheDocument();
    const toggle2FABtn = screen.getByTestId('toggle-2fa-btn');
    fireEvent.click(toggle2FABtn);
    expect(screen.getByText('2FA Ativado: Sim')).toBeInTheDocument();
  });

  it('deve alterar o tempo de inatividade quando o botÃ£o Ã© clicado', () => {
    render(<SettingsSeguranca />);

    expect(screen.getByText('Tempo de Inatividade: 30 minutos')).toBeInTheDocument();
    const alterarTempoBtn = screen.getByTestId('alterar-tempo-btn');
    fireEvent.click(alterarTempoBtn);
    expect(screen.getByText('Tempo de Inatividade: 60 minutos')).toBeInTheDocument();
  });

  it('deve permitir a geraÃ§Ã£o de um novo token e mostrar o diÃ¡logo', () => {
    render(<SettingsSeguranca />);

    const novoTokenInput = screen.getByTestId('input-novoTokenNome');
    fireEvent.change(novoTokenInput, { target: { value: 'Novo Token Teste' } });

    const gerarTokenBtn = screen.getAllByText(/Gerar novo token/i)[0].closest('button');
    if (gerarTokenBtn) {
      fireEvent.click(gerarTokenBtn);
    }

    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent(/Token gerado com sucesso/i);
  });

  it('deve interagir com as RestriÃ§Ãµes de IP', () => {
    render(<SettingsSeguranca />);

    // Alternar restriÃ§Ã£o
    const toggleRestricaoBtn = screen.getByTestId('toggle-restricao-btn');
    expect(screen.getByText('RestriÃ§Ã£o IP: Desativada')).toBeInTheDocument();
    fireEvent.click(toggleRestricaoBtn);
    expect(screen.getByText('RestriÃ§Ã£o IP: Ativada')).toBeInTheDocument();

    // Adicionar IP
    const novoIpInput = screen.getByTestId('novo-ip-input');
    const adicionarIpBtn = screen.getByTestId('adicionar-ip-btn');
    fireEvent.change(novoIpInput, { target: { value: '192.168.1.100' } });
    fireEvent.click(adicionarIpBtn);
    expect(screen.getByText(/192.168.1.100/)).toBeInTheDocument();
  });

  it('deve interagir com as Chaves de Webhook', () => {
    render(<SettingsSeguranca />);

    // Gerar nova chave (a lÃ³gica de geraÃ§Ã£o real estÃ¡ no componente, o mock sÃ³ expÃµe o botÃ£o)
    const gerarChaveBtn = screen.getByTestId('gerar-chave-btn');
    fireEvent.click(gerarChaveBtn);

    // Copiar chave
    const copiarChaveBtn = screen.getByTestId('copiar-chave-btn');
    fireEvent.click(copiarChaveBtn);
    expect(mockCopyToClipboard).toHaveBeenCalled(); // Verifica apenas se a funÃ§Ã£o foi chamada, sem verificar o valor especÃ­fico
  });

  it('deve interagir com os Logs de Auditoria', () => {
    render(<SettingsSeguranca />);

    // Filtrar logs (a lÃ³gica de filtro real estÃ¡ no componente, o mock sÃ³ expÃµe o botÃ£o)
    const filtrarLogsBtn = screen.getByTestId('filtrar-logs-btn');
    fireEvent.click(filtrarLogsBtn);
    // Verifica se a funÃ§Ã£o de alerta (simulando filtro) foi chamada
    expect(window.alert).toHaveBeenCalledWith("Filtros aplicados!");
  });

  it('deve interagir com os Alertas de SeguranÃ§a', () => {
    render(<SettingsSeguranca />);

    // Alternar alerta
    const toggleAlertaBtn = screen.getByTestId('toggle-alerta-dispositivo-btn');
    expect(screen.getByText('Alertas Novo Dispositivo: Sim')).toBeInTheDocument();
    fireEvent.click(toggleAlertaBtn);
    expect(screen.getByText('Alertas Novo Dispositivo: NÃ£o')).toBeInTheDocument();
  });

  it('deve permitir revogar um token', () => {
    render(<SettingsSeguranca />);

    // Encontrar um botÃ£o de revogar token (pode ser pelo texto ou um testid se existir no componente real)
    // Assumindo que o primeiro token tem um botÃ£o "Revogar"
    const revokeTokenButtons = screen.getAllByRole('button', { name: /Revogar/i });
    expect(revokeTokenButtons.length).toBeGreaterThan(0); // Garante que hÃ¡ tokens para revogar
    
    // Clicar para revogar o primeiro token listado
    fireEvent.click(revokeTokenButtons[0]);

    // Verificar se o token foi removido (a tabela de tokens deve ser atualizada)
    // Esta verificaÃ§Ã£o depende de como os tokens sÃ£o renderizados. 
    // Se o nome do token Ã© "Power BI - Financeiro", ele nÃ£o deve mais estar presente.
    expect(screen.queryByText("Power BI - Financeiro")).not.toBeInTheDocument();
  });

  it('deve chamar a funÃ§Ã£o de teste do webhook', () => {
    render(<SettingsSeguranca />);
    
    // Procura o botÃ£o pelo testId em vez do texto
    const testarWebhookButton = screen.getByTestId('testar-webhook-btn');
    fireEvent.click(testarWebhookButton);
    expect(window.alert).toHaveBeenCalledWith("Payload de teste enviado com sucesso!");
  });
});
