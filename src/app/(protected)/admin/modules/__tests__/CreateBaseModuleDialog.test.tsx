import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateBaseModuleDialog } from '../components/lifecycle/CreateBaseModuleDialog';

// Mock das dependências
jest.mock('@/shared/ui/toast', () => ({
  useToast: () => ({
    toast: {
      success: jest.fn(),
      error: jest.fn()
    }
  })
}));

jest.mock('../hooks/useSystemConfig', () => ({
  useSystemConfig: () => ({
    config: {},
    isVersioningEnabled: true
  })
}));

jest.mock('@/app/actions/admin/modules/base-modules', () => ({
  createBaseModule: jest.fn()
}));

const mockCreateBaseModule = require('@/app/actions/admin/modules/base-modules').createBaseModule;

describe('CreateBaseModuleDialog', () => {
  const mockProps = {
    onSuccess: jest.fn(),
    onOptimisticCreate: jest.fn(),
    onServerSuccess: jest.fn(),
    onServerError: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o trigger button corretamente', () => {
    render(<CreateBaseModuleDialog {...mockProps} />);
    
    expect(screen.getByRole('button', { name: /novo módulo base/i })).toBeInTheDocument();
  });

  it('deve abrir o dialog quando clicar no trigger', async () => {
    const user = userEvent.setup();
    render(<CreateBaseModuleDialog {...mockProps} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    expect(screen.getByText('Criar Novo Módulo Base')).toBeInTheDocument();
    expect(screen.getByText(/crie um novo módulo base/i)).toBeInTheDocument();
  });

  it('deve preencher campos obrigatórios corretamente', async () => {
    const user = userEvent.setup();
    render(<CreateBaseModuleDialog {...mockProps} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    const nameInput = screen.getByLabelText(/nome do módulo/i);
    const descriptionInput = screen.getByLabelText(/descrição/i);
    
    await user.type(nameInput, 'Test Module');
    await user.type(descriptionInput, 'This is a test module description');
    
    expect(nameInput).toHaveValue('Test Module');
    expect(descriptionInput).toHaveValue('This is a test module description');
  });

  it('deve gerar slug automaticamente baseado no nome', async () => {
    const user = userEvent.setup();
    render(<CreateBaseModuleDialog {...mockProps} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    const nameInput = screen.getByLabelText(/nome do módulo/i);
    const slugInput = screen.getByLabelText(/identificador/i);
    
    await user.type(nameInput, 'Test Analytics Module');
    
    expect(slugInput).toHaveValue('test-analytics-module');
  });

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup();
    render(<CreateBaseModuleDialog {...mockProps} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    const submitButton = screen.getByRole('button', { name: /criar módulo base/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/nome deve ter pelo menos 2 caracteres/i)).toBeInTheDocument();
    });
  });

  it('deve submeter formulário com modo otimístico', async () => {
    const user = userEvent.setup();
    mockCreateBaseModule.mockResolvedValue({ success: true, data: { id: 'test-id' } });
    mockProps.onOptimisticCreate.mockReturnValue('operation-id');
    
    render(<CreateBaseModuleDialog {...mockProps} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    // Preencher formulário
    await user.type(screen.getByLabelText(/nome do módulo/i), 'Test Module');
    await user.type(screen.getByLabelText(/descrição/i), 'This is a test module description');
    
    // Selecionar categoria
    await user.click(screen.getByText(/selecione uma categoria/i));
    await user.click(screen.getByText('analytics'));
    
    // Preencher URL de acesso
    await user.type(screen.getByLabelText(/url de acesso/i), 'test-module');
    
    // Submeter
    await user.click(screen.getByRole('button', { name: /criar módulo base/i }));
    
    await waitFor(() => {
      expect(mockProps.onOptimisticCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Module',
          slug: 'test-module',
          description: 'This is a test module description',
          category: 'analytics'
        })
      );
    });
  });

  it('deve submeter formulário com modo tradicional quando não há callbacks otimísticos', async () => {
    const user = userEvent.setup();
    mockCreateBaseModule.mockResolvedValue({ success: true });
    
    const propsWithoutOptimistic = {
      onSuccess: jest.fn()
    };
    
    render(<CreateBaseModuleDialog {...propsWithoutOptimistic} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    // Preencher formulário mínimo
    await user.type(screen.getByLabelText(/nome do módulo/i), 'Test Module');
    await user.type(screen.getByLabelText(/descrição/i), 'This is a test module description');
    await user.click(screen.getByText(/selecione uma categoria/i));
    await user.click(screen.getByText('analytics'));
    await user.type(screen.getByLabelText(/url de acesso/i), 'test-module');
    
    await user.click(screen.getByRole('button', { name: /criar módulo base/i }));
    
    await waitFor(() => {
      expect(mockCreateBaseModule).toHaveBeenCalled();
      expect(propsWithoutOptimistic.onSuccess).toHaveBeenCalled();
    });
  });

  it('deve mostrar erro quando server action falha', async () => {
    const user = userEvent.setup();
    mockCreateBaseModule.mockResolvedValue({ success: false, error: 'Erro de teste' });
    mockProps.onOptimisticCreate.mockReturnValue('operation-id');
    
    render(<CreateBaseModuleDialog {...mockProps} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    // Preencher e submeter formulário
    await user.type(screen.getByLabelText(/nome do módulo/i), 'Test Module');
    await user.type(screen.getByLabelText(/descrição/i), 'This is a test module description');
    await user.click(screen.getByText(/selecione uma categoria/i));
    await user.click(screen.getByText('analytics'));
    await user.type(screen.getByLabelText(/url de acesso/i), 'test-module');
    
    await user.click(screen.getByRole('button', { name: /criar módulo base/i }));
    
    await waitFor(() => {
      expect(mockProps.onServerError).toHaveBeenCalledWith('operation-id', 'Erro de teste');
    });
  });

  it('deve resetar formulário após submit bem-sucedido', async () => {
    const user = userEvent.setup();
    mockCreateBaseModule.mockResolvedValue({ success: true });
    
    const propsWithoutOptimistic = {
      onSuccess: jest.fn()
    };
    
    render(<CreateBaseModuleDialog {...propsWithoutOptimistic} />);
    
    await user.click(screen.getByRole('button', { name: /novo módulo base/i }));
    
    const nameInput = screen.getByLabelText(/nome do módulo/i);
    
    // Preencher formulário
    await user.type(nameInput, 'Test Module');
    await user.type(screen.getByLabelText(/descrição/i), 'This is a test module description');
    await user.click(screen.getByText(/selecione uma categoria/i));
    await user.click(screen.getByText('analytics'));
    await user.type(screen.getByLabelText(/url de acesso/i), 'test-module');
    
    await user.click(screen.getByRole('button', { name: /criar módulo base/i }));
    
    await waitFor(() => {
      expect(propsWithoutOptimistic.onSuccess).toHaveBeenCalled();
    });
    
    // Dialog deve fechar
    expect(screen.queryByText('Criar Novo Módulo Base')).not.toBeInTheDocument();
  });
});