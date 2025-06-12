import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PerfilDialog } from "../components/perfis-usuarios/components/perfil-dialog";
import { PerfilUsuario } from "../types/perfis";

// Interface para as props do PerfilDialog
interface PerfilDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (perfil: PerfilUsuario) => Promise<void>;
  perfil?: PerfilUsuario;
  isLoading?: boolean;
}

// Mock para o UUID
const mockUUID = '123-test-id';
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => mockUUID)
}));

// Função de renderização auxiliar
const renderPerfDialog = (props: Partial<PerfilDialogProps> = {}) => {
  const defaultProps: PerfilDialogProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSalvar: jest.fn(),
    perfil: undefined,
    isLoading: false
  };

  return render(
    <PerfilDialog {...defaultProps} {...props} />
  );
};

// Mock dos componentes internos
// Mock dos componentes internos
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" role="dialog" aria-modal={open}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => {
    const handleChange = (e: any) => {
      if (props.onChange) {
        props.onChange(e);
      }
    };
    
    return (
      <input 
        data-testid={`input-${props.id || 'unnamed'}`} 
        value={props.value || ""}
        onChange={handleChange}
        {...props} 
      />
    );
  }
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => <label data-testid={`label-${htmlFor || 'unnamed'}`} htmlFor={htmlFor}>{children}</label>
}));

jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: (props: any) => {
    const handleChange = (e: any) => {
      if (props.onCheckedChange) {
        props.onCheckedChange(e.target.checked);
      }
    };
    
    return (
      <input 
        type="checkbox" 
        data-testid={`checkbox-${props.id || 'unnamed'}`} 
        checked={props.checked || false}
        onChange={handleChange}
        id={props.id}
        disabled={props.disabled}
      />
    );
  }
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => {
    const buttonType = typeof children === 'string' && 
                      (children === 'Salvar' || children.includes('Salvando')) 
                      ? 'salvar-button' 
                      : 'cancelar-button';
    
    return (
      <button 
        data-testid={buttonType}
        onClick={(e: any) => {
          e.preventDefault = () => {};
          onClick && onClick(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
}));

// Mock dos componentes internos
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" role="dialog" aria-modal={open}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}));

jest.mock("@/components/ui/input", () => ({
  Input: (props: any) => {
    const handleChange = (e: any) => {
      if (props.onChange) {
        props.onChange(e);
      }
    };
    
    return (
      <input 
        data-testid={`input-${props.id || 'unnamed'}`} 
        value={props.value || ""}
        onChange={handleChange}
        {...props} 
      />
    );
  }
}));

jest.mock("@/components/ui/label", () => ({
  Label: ({ children, htmlFor }: any) => <label data-testid={`label-${htmlFor || 'unnamed'}`} htmlFor={htmlFor}>{children}</label>
}));

jest.mock("@/components/ui/checkbox", () => ({
  Checkbox: (props: any) => {
    const handleChange = (e: any) => {
      if (props.onCheckedChange) {
        props.onCheckedChange(e.target.checked);
      }
    };
    
    return (
      <input 
        type="checkbox" 
        data-testid={`checkbox-${props.id || 'unnamed'}`} 
        checked={props.checked || false}
        onChange={handleChange}
        id={props.id}
        disabled={props.disabled}
      />
    );
  }
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => {
    // Determina o data-testid com base no texto do botão
    const buttonType = typeof children === 'string' && 
                      (children === 'Salvar' || children.includes('Salvando')) 
                      ? 'salvar-button' 
                      : 'cancelar-button';
    
    return (
      <button 
        data-testid={buttonType}
        onClick={(e: any) => {
          // Simula preventDefault
          e.preventDefault = () => {};
          onClick && onClick(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
}));

// Dados de teste
const mockPerfil: PerfilUsuario = {
  id: "1",
  nome: "Teste",
  descricao: "Perfil de teste",
  permissoes: ["usuarios", "relatorios"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Patch para o método handleSubmit, contornando o preventDefault
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (args[0] && args[0].includes && args[0].includes('preventDefault is not a function')) {
    return;
  }
  originalConsoleError(...args);
};

// Mock do evento de formulário
const createMockEvent = () => ({
  preventDefault: jest.fn(),
  target: {
    nome: { value: '' },
    descricao: { value: '' }
  }
});

describe("PerfilDialog", () => {
  const mockOnSalvar = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper para renderizar o componente
  const renderPerfDialog = (props: Partial<typeof PerfilDialog.arguments[0]> = {}) => {
    return render(
      <PerfilDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSalvar={mockOnSalvar}
        isLoading={false}
        {...props}
      />
    );
  };

  it("deve renderizar corretamente ao criar um novo perfil", () => {
    renderPerfDialog();

    // Verifica se o componente está presente
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-title")).toBeInTheDocument();
    
    // Verifica se existem botões
    expect(screen.getByTestId("salvar-button")).toBeInTheDocument();
    expect(screen.getByTestId("cancelar-button")).toBeInTheDocument();
  });

  it("deve mostrar texto correto para perfil novo vs. existente", () => {
    // Novo perfil
    const { rerender } = renderPerfDialog();
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(/novo perfil/i);
    
    // Perfil existente
    rerender(
      <PerfilDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onSalvar={mockOnSalvar}
        perfil={mockPerfil}
        isLoading={false}
      />
    );
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(/editar perfil/i);
  });

  it("deve chamar onOpenChange ao clicar no botão cancelar", () => {
    renderPerfDialog();
    
    fireEvent.click(screen.getByTestId("cancelar-button"));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve mostrar estado de carregamento quando isLoading é true", () => {
    renderPerfDialog({ isLoading: true });
    
    expect(screen.getByTestId("salvar-button")).toHaveTextContent(/salvando/i);
    expect(screen.getByTestId("salvar-button")).toBeDisabled();
    expect(screen.getByTestId("cancelar-button")).toBeDisabled();
  });

  it("deve exibir os campos do formulário", () => {
    renderPerfDialog();
    
    // Verifica se os campos do formulário estão presentes
    expect(screen.getByTestId("input-nome")).toBeInTheDocument();
    expect(screen.getByTestId("input-descricao")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-todos")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-usuarios")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-relatorios")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-operacao")).toBeInTheDocument();
  });
  
  it("deve carregar os dados de um perfil existente", () => {
    renderPerfDialog({ perfil: mockPerfil });
    
    expect(screen.getByTestId("input-nome")).toHaveValue("Teste");
    expect(screen.getByTestId("input-descricao")).toHaveValue("Perfil de teste");
    expect(screen.getByTestId("checkbox-usuarios")).toBeChecked();
    expect(screen.getByTestId("checkbox-relatorios")).toBeChecked();
    expect(screen.getByTestId("checkbox-todos")).not.toBeChecked();
    expect(screen.getByTestId("checkbox-operacao")).not.toBeChecked();
  });
  
  it("deve atualizar os valores ao editar os campos", () => {
    renderPerfDialog();
    
    // Editar campos
    fireEvent.change(screen.getByTestId("input-nome"), { target: { value: "Novo Perfil" } });
    fireEvent.change(screen.getByTestId("input-descricao"), { target: { value: "Descrição do novo perfil" } });
    fireEvent.click(screen.getByTestId("checkbox-todos"));
    
    // Verificar mudanças
    expect(screen.getByTestId("input-nome")).toHaveValue("Novo Perfil");
    expect(screen.getByTestId("input-descricao")).toHaveValue("Descrição do novo perfil");
    expect(screen.getByTestId("checkbox-todos")).toBeChecked();
  });
  
  it("deve exibir erro quando validação falha por nome em branco", async () => {
    renderPerfDialog();

    // Deixar nome em branco
    fireEvent.change(screen.getByTestId('input-nome'), {
      target: { value: '' }
    });

    // Preencher descrição
    fireEvent.change(screen.getByTestId('input-descricao'), {
      target: { value: 'Descrição teste' }
    });

    // Submeter formulário
    const form = screen.getByTestId('perfil-form');
    const mockEvent = createMockEvent();
    fireEvent.submit(form, mockEvent);

    // Verificar mensagem de erro
    await waitFor(() => {
      const errorElement = screen.getByTestId('nome-error');
      expect(errorElement).toHaveTextContent('O nome do perfil é obrigatório');
    });
  });
  
  it("deve exibir erro quando validação falha por descrição em branco", async () => {
    renderPerfDialog();

    // Preencher nome
    fireEvent.change(screen.getByTestId('input-nome'), {
      target: { value: 'Nome teste' }
    });

    // Deixar descrição em branco
    fireEvent.change(screen.getByTestId('input-descricao'), {
      target: { value: '' }
    });

    // Submeter formulário
    const form = screen.getByTestId('perfil-form');
    const mockEvent = createMockEvent();
    fireEvent.submit(form, mockEvent);

    // Verificar mensagem de erro
    await waitFor(() => {
      const errorElement = screen.getByTestId('descricao-error');
      expect(errorElement).toHaveTextContent('A descrição é obrigatória');
    });
  });
  
  it("deve exibir erro quando validação falha por falta de permissões", async () => {
    renderPerfDialog();

    // Preencher campos obrigatórios
    fireEvent.change(screen.getByTestId('input-nome'), {
      target: { value: 'Nome teste' }
    });
    fireEvent.change(screen.getByTestId('input-descricao'), {
      target: { value: 'Descrição teste' }
    });

    // Não marcar nenhuma permissão
    const form = screen.getByTestId('perfil-form');
    const mockEvent = createMockEvent();
    fireEvent.submit(form, mockEvent);

    // Verificar mensagem de erro
    await waitFor(() => {
      const errorElement = screen.getByTestId('permissoes-error');
      expect(errorElement).toHaveTextContent(/selecione pelo menos uma permissão/i);
    });
  });
  
  it("deve chamar onSalvar com dados corretos para um novo perfil", async () => {
    renderPerfDialog();

    // Preencher dados
    fireEvent.change(screen.getByTestId('input-nome'), {
      target: { value: 'Novo Perfil' }
    });
    fireEvent.change(screen.getByTestId('input-descricao'), {
      target: { value: 'Descrição do novo perfil' }
    });

    // Marcar permissões
    fireEvent.click(screen.getByTestId('checkbox-usuarios'));
    fireEvent.click(screen.getByTestId('checkbox-relatorios'));

    // Submeter formulário
    const form = screen.getByTestId('perfil-form');
    const mockEvent = createMockEvent();
    mockEvent.target.nome.value = 'Novo Perfil';
    mockEvent.target.descricao.value = 'Descrição do novo perfil';
    fireEvent.submit(form, mockEvent);

    // Verificar chamada do onSalvar
    await waitFor(() => {
      expect(mockOnSalvar).toHaveBeenCalledTimes(1);
      const chamada = mockOnSalvar.mock.calls[0][0];
      expect(chamada).toMatchObject({
        nome: 'Novo Perfil',
        descricao: 'Descrição do novo perfil',
        permissoes: ['usuarios', 'relatorios']
      });
      expect(chamada.id).toBeDefined();
    });
  });
  
  it("deve chamar onSalvar com dados corretos para um perfil existente", async () => {
    const perfilExistente = {
      id: '1',
      nome: 'Perfil Original',
      descricao: 'Perfil de teste',
      permissoes: ['usuarios']
    };

    renderPerfDialog({ perfil: perfilExistente });

    // Atualizar dados
    fireEvent.change(screen.getByTestId('input-nome'), {
      target: { value: 'Perfil Atualizado' }
    });

    // Marcar permissões adicionais
    fireEvent.click(screen.getByTestId('checkbox-relatorios'));

    // Submeter formulário
    const form = screen.getByTestId('perfil-form');
    const mockEvent = createMockEvent();
    mockEvent.target.nome.value = 'Perfil Atualizado';
    mockEvent.target.descricao.value = 'Perfil de teste';
    fireEvent.submit(form, mockEvent);

    // Verificar chamada do onSalvar
    await waitFor(() => {
      expect(mockOnSalvar).toHaveBeenCalledTimes(1);
      const chamada = mockOnSalvar.mock.calls[0][0];
      expect(chamada).toMatchObject({
        id: '1',
        nome: 'Perfil Atualizado',
        descricao: 'Perfil de teste',
        permissoes: ['usuarios', 'relatorios']
      });
    });
  });
  
  it("deve alternar seleção de permissões corretamente", () => {
    renderPerfDialog();
    
    // Inicialmente nenhuma permissão selecionada
    expect(screen.getByTestId("checkbox-todos")).not.toBeChecked();
    
    // Selecionar uma permissão
    fireEvent.click(screen.getByTestId("checkbox-usuarios"));
    expect(screen.getByTestId("checkbox-usuarios")).toBeChecked();
    
    // Selecionar outra permissão
    fireEvent.click(screen.getByTestId("checkbox-relatorios"));
    expect(screen.getByTestId("checkbox-relatorios")).toBeChecked();
    expect(screen.getByTestId("checkbox-usuarios")).toBeChecked();
    
    // Desmarcar uma permissão
    fireEvent.click(screen.getByTestId("checkbox-usuarios"));
    expect(screen.getByTestId("checkbox-usuarios")).not.toBeChecked();
    expect(screen.getByTestId("checkbox-relatorios")).toBeChecked();
  });
});
