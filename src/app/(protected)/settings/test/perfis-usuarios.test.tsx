import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PerfisUsuarios from "../components/perfis-usuarios/perfis-usuarios";
import { PerfilUsuario } from "../types/perfis";

// Mock do contexto
jest.mock("../contexts/perfis-context", () => ({
  usePerfilUsuario: () => ({
    perfis: [
      {
        id: "id-admin",
        nome: "Admin",
        descricao: "Acesso total ao sistema",
        permissoes: ["todos"],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "id-gestor",
        nome: "Gestor",
        descricao: "Pode gerenciar usuários e visualizar relatórios",
        permissoes: ["usuarios", "relatorios"],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "id-operador",
        nome: "Operador",
        descricao: "Acesso restrito à operação diária",
        permissoes: ["operacao"],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    isLoading: false,
    error: null,
    criarPerfil: jest.fn(),
    editarPerfil: jest.fn(),
    removerPerfil: jest.fn()
  }),
  PerfilUsuarioProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock de componentes internos para simplificar os testes
jest.mock("../components/common/dialog/generic-dialog", () => ({
  GenericDialog: ({ children, ...props }: any) => (
    <div data-testid="generic-dialog" {...props}>
      {children}
    </div>
  )
}));

jest.mock("../components/perfis-usuarios/components/perfil-dialog", () => ({
  PerfilDialog: ({ ...props }: any) => (
    <div data-testid="perfil-dialog" role="dialog" aria-modal="true" {...props}>
      <input data-testid="nome-input" />
      <input data-testid="descricao-input" />
      <button data-testid="salvar-button">Salvar</button>
    </div>
  )
}));

jest.mock("../components/common/table/generic-table", () => ({
  GenericTable: ({ data, ...props }: any) => (
    <div data-testid="generic-table" {...props}>
      {data.map((row: any, index: number) => (
        <div key={index} data-testid={`row-${index}`}>
          <div>{row.nome}</div>
          <div>{row.descricao}</div>
          <button data-testid={`editar-${index}`}>Editar</button>
          <button data-testid={`remover-${index}`}>Remover</button>
        </div>
      ))}
    </div>
  )
}));

describe("PerfisUsuarios", () => {
  // Renderiza o componente com o contexto
  beforeEach(() => {
    render(<PerfisUsuarios />);
  });

  it("deve renderizar o título e descrição", () => {
    expect(screen.getByText("Gestão de Perfis")).toBeInTheDocument();
    expect(screen.getByText("Gerencie os tipos de perfis e permissões disponíveis")).toBeInTheDocument();
  });

  it("deve renderizar o botão de novo perfil", () => {
    expect(screen.getByText("Novo perfil")).toBeInTheDocument();
  });

  it("deve renderizar a tabela com perfis", () => {
    expect(screen.getByTestId("generic-table")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Gestor")).toBeInTheDocument();
    expect(screen.getByText("Operador")).toBeInTheDocument();
  });

  it("deve renderizar os botões de ação", () => {
    expect(screen.getByTestId("editar-0")).toBeInTheDocument();
    expect(screen.getByTestId("remover-0")).toBeInTheDocument();
  });
});
