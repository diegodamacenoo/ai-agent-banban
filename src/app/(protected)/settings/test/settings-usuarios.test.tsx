import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingsUsuarios from "../components/settings-usuarios";

// Mock dos componentes
jest.mock("../components/usuarios-components/usuarios-invite-dialog", () => ({
  UsuariosInviteDialog: ({ trigger }: any) => (
    <div data-testid="usuarios-invite-dialog">
      {trigger}
    </div>
  )
}));

jest.mock("../components/usuarios-components/gestao-usuarios", () => ({
  GestaoUsuarios: () => <div data-testid="gestao-usuarios">Gestão de Usuários Mockada</div>,
  ConvitesUsuario: () => <div data-testid="convites-usuario">Convites Mockados</div>
}));

jest.mock("../components/perfis-usuarios/perfis-usuarios", () => ({
  __esModule: true,
  default: () => <div data-testid="perfis-usuarios">Perfis de Usuários Mockados</div>
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  )
}));

jest.mock("lucide-react", () => ({
  MailIcon: () => <span data-testid="mail-icon">📧</span>
}));

describe("SettingsUsuarios", () => {
  beforeEach(() => {
    render(<SettingsUsuarios />);
  });

  it("deve renderizar o título principal", () => {
    expect(screen.getByText("Usuários")).toBeInTheDocument();
  });

  it("deve renderizar o componente de gestão de usuários", () => {
    expect(screen.getByTestId("gestao-usuarios")).toBeInTheDocument();
    expect(screen.getByText("Gestão de Usuários")).toBeInTheDocument();
    expect(screen.getByText("Cadastre, edite ou desative contas de usuários")).toBeInTheDocument();
  });

  it("deve renderizar o botão de convite", () => {
    expect(screen.getByTestId("usuarios-invite-dialog")).toBeInTheDocument();
    expect(screen.getByText("Convidar por Email")).toBeInTheDocument();
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
  });

  it("deve renderizar o componente de perfis de usuários", () => {
    expect(screen.getByTestId("perfis-usuarios")).toBeInTheDocument();
  });

  it("deve renderizar o componente de convites", () => {
    expect(screen.getByTestId("convites-usuario")).toBeInTheDocument();
    expect(screen.getByText("Convites")).toBeInTheDocument();
    expect(screen.getByText("Gerencie convites enviados para novos usuários")).toBeInTheDocument();
  });
}); 