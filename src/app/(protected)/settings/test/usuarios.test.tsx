import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GestaoUsuarios, ConvitesUsuario } from "../components/usuarios-components/gestao-usuarios";
import { UsuariosInviteDialog } from "../components/usuarios-components/usuarios-invite-dialog";

// Mock dos componentes internos
jest.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
}));

jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableCell: ({ children, className }: any) => <td data-testid="table-cell" className={className}>{children}</td>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock("lucide-react", () => ({
  MailIcon: () => <span data-testid="mail-icon">🔄</span>,
  EditIcon: () => <span data-testid="edit-icon">✏️</span>,
  TrashIcon: () => <span data-testid="trash-icon">🗑️</span>
}));

// Mock do Dialog para o UsuariosInviteDialog
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: any) => <div data-testid="dialog">{children}</div>,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogTrigger: ({ children, asChild }: any) => <div data-testid="dialog-trigger">{children}</div>
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

jest.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      {children}
      <select 
        data-testid="select-native" 
        value={value || ""} 
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
      >
        <option value="admin">Admin</option>
        <option value="usuario">Usuário</option>
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children, id }: any) => <div data-testid={`select-trigger-${id}`}>{children}</div>,
  SelectValue: ({ children, placeholder }: any) => <div data-testid="select-value" data-placeholder={placeholder}>{children}</div>
}));

describe("GestaoUsuarios", () => {
  beforeEach(() => {
    render(<GestaoUsuarios />);
  });

  it("deve renderizar a tabela de usuários", () => {
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("card")).toBeInTheDocument();
  });

  it("deve exibir usuários na tabela", () => {
    expect(screen.getByText("João Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Editor")).toBeInTheDocument();
    expect(screen.getByText("joao@exemplo.com")).toBeInTheDocument();
    expect(screen.getByText("maria@exemplo.com")).toBeInTheDocument();
  });

  it("deve exibir botões de ação para cada usuário", () => {
    const editButtons = screen.getAllByText("Editar");
    expect(editButtons.length).toBe(2);
    
    const deleteIcons = screen.getAllByTestId("trash-icon");
    expect(deleteIcons.length).toBe(2);
  });
});

describe("ConvitesUsuario", () => {
  beforeEach(() => {
    render(<ConvitesUsuario />);
  });

  it("deve renderizar a tabela de convites", () => {
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  it("deve exibir os convites na tabela", () => {
    expect(screen.getByText("ana@exemplo.com")).toBeInTheDocument();
    expect(screen.getByText("pedro@exemplo.com")).toBeInTheDocument();
    expect(screen.getAllByText("Pendente").length).toBe(2);
  });

  it("deve exibir botões de ação para cada convite", () => {
    const reenviarButtons = screen.getAllByText("Reenviar");
    expect(reenviarButtons.length).toBe(2);
  });
});

describe("UsuariosInviteDialog", () => {
  const mockTrigger = <button data-testid="trigger-button">Abrir</button>;
  
  beforeEach(() => {
    // Espiar a função global window.alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<UsuariosInviteDialog trigger={mockTrigger} />);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar o botão trigger", () => {
    expect(screen.getByTestId("trigger-button")).toBeInTheDocument();
  });

  it("deve renderizar o diálogo de convite", () => {
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  it("deve ter campos para o email e perfil", () => {
    expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    expect(screen.getByTestId("label-invite-email")).toBeInTheDocument();
    expect(screen.getByTestId("input-invite-email")).toBeInTheDocument();
    expect(screen.getByTestId("select-trigger-invite-perfil")).toBeInTheDocument();
  });

  it("deve ter um botão para enviar o convite", () => {
    expect(screen.getByText("Enviar convite")).toBeInTheDocument();
  });
  
  it("deve atualizar o valor do email quando o input é alterado", () => {
    const emailInput = screen.getByTestId("input-invite-email");
    
    fireEvent.change(emailInput, { target: { value: "test@exemplo.com" } });
    
    expect(emailInput).toHaveValue("test@exemplo.com");
  });
  
  it("deve atualizar o valor do perfil quando o select é alterado", () => {
    const selectNative = screen.getByTestId("select-native");
    
    fireEvent.change(selectNative, { target: { value: "admin" } });
    
    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "admin");
  });
  
  it("deve chamar handleInvite ao clicar no botão de enviar convite", () => {
    const emailInput = screen.getByTestId("input-invite-email");
    const selectNative = screen.getByTestId("select-native");
    const enviarButton = screen.getByText("Enviar convite");
    
    // Preencher o formulário
    fireEvent.change(emailInput, { target: { value: "test@exemplo.com" } });
    fireEvent.change(selectNative, { target: { value: "admin" } });
    
    // Enviar o formulário
    fireEvent.click(enviarButton);
    
    // Verificar se o email foi resetado após o envio
    expect(emailInput).toHaveValue("");
    
    // Verificar se o perfil voltou ao valor padrão
    expect(screen.getByTestId("select")).toHaveAttribute("data-value", "usuario");
  });
}); 