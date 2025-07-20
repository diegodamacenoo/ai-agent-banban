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
  GestaoUsuarios: () => <div data-testid="gestao-usuarios">GestÃ£o de UsuÃ¡rios Mockada</div>,
  ConvitesUsuario: () => <div data-testid="convites-usuario">Convites Mockados</div>
}));

jest.mock("../components/perfis-usuarios/perfis-usuarios", () => ({
  __esModule: true,
  default: () => <div data-testid="perfis-usuarios">Perfis de UsuÃ¡rios Mockados</div>
}));

jest.mock("@/shared/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  )
}));

jest.mock("lucide-react", () => ({
  MailIcon: () => <span data-testid="mail-icon">ðŸ“§</span>
}));

describe("SettingsUsuarios", () => {
  beforeEach(() => {
    render(<SettingsUsuarios />);
  });

  it("deve renderizar o tÃ­tulo principal", () => {
    expect(screen.getByText("UsuÃ¡rios")).toBeInTheDocument();
  });

  it("deve renderizar o componente de gestÃ£o de usuÃ¡rios", () => {
    expect(screen.getByTestId("gestao-usuarios")).toBeInTheDocument();
    expect(screen.getByText("GestÃ£o de UsuÃ¡rios")).toBeInTheDocument();
    expect(screen.getByText("Cadastre, edite ou desative contas de usuÃ¡rios")).toBeInTheDocument();
  });

  it("deve renderizar o botÃ£o de convite", () => {
    expect(screen.getByTestId("usuarios-invite-dialog")).toBeInTheDocument();
    expect(screen.getByText("Convidar por Email")).toBeInTheDocument();
    expect(screen.getByTestId("mail-icon")).toBeInTheDocument();
  });

  it("deve renderizar o componente de perfis de usuÃ¡rios", () => {
    expect(screen.getByTestId("perfis-usuarios")).toBeInTheDocument();
  });

  it("deve renderizar o componente de convites", () => {
    expect(screen.getByTestId("convites-usuario")).toBeInTheDocument();
    expect(screen.getByText("Convites")).toBeInTheDocument();
    expect(screen.getByText("Gerencie convites enviados para novos usuÃ¡rios")).toBeInTheDocument();
  });
}); 
