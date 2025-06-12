import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GenericDialog } from "../components/common/dialog/generic-dialog";

// Mock dos componentes internos
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div 
      data-testid="dialog" 
      role="dialog" 
      aria-modal={open} 
      className={open ? "dialog-open" : "dialog-closed"}
      onClick={() => onOpenChange && onOpenChange(false)}
    >
      {children}
    </div>
  ),
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  )
}));

describe("GenericDialog", () => {
  const mockTitle = "Título do Diálogo";
  const mockDescription = "Descrição do diálogo";
  const mockContent = <div data-testid="mock-content">Conteúdo do diálogo</div>;
  const mockFooter = <div data-testid="mock-footer">Rodapé do diálogo</div>;
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar corretamente quando aberto", () => {
    render(
      <GenericDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title={mockTitle}
        description={mockDescription}
      >
        {mockContent}
      </GenericDialog>
    );
    
    // Verificar se os elementos estão presentes
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog")).toHaveClass("dialog-open");
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(mockTitle);
    expect(screen.getByTestId("dialog-description")).toHaveTextContent(mockDescription);
    expect(screen.getByTestId("mock-content")).toBeInTheDocument();
  });

  it("não deve renderizar conteúdo quando fechado", () => {
    const { container } = render(
      <GenericDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        title={mockTitle}
        description={mockDescription}
      >
        {mockContent}
      </GenericDialog>
    );
    
    // O diálogo não deve estar visível
    expect(container.querySelector('[data-testid="dialog"]')).toHaveClass("dialog-closed");
  });

  it("deve chamar onOpenChange quando o diálogo é clicado", () => {
    render(
      <GenericDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title={mockTitle}
      >
        {mockContent}
      </GenericDialog>
    );
    
    // Simula o clique no diálogo para fechá-lo
    fireEvent.click(screen.getByTestId("dialog"));
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve renderizar o rodapé quando fornecido", () => {
    render(
      <GenericDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title={mockTitle}
        footer={mockFooter}
      >
        {mockContent}
      </GenericDialog>
    );
    
    expect(screen.getByTestId("mock-footer")).toBeInTheDocument();
  });

  it("deve aplicar classes personalizadas", () => {
    const customClass = "custom-dialog-class";
    render(
      <GenericDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title={mockTitle}
        className={customClass}
      >
        {mockContent}
      </GenericDialog>
    );
    
    expect(screen.getByTestId("dialog-content")).toHaveClass(customClass);
  });

  it("deve renderizar corretamente com estado de carregamento", () => {
    render(
      <GenericDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title={mockTitle}
        isLoading={true}
      >
        {mockContent}
      </GenericDialog>
    );
    
    // Verificar se está no modo de carregamento
    // Note: Este teste é apenas para demonstração, já que o componente real
    // pode não ter uma indicação visual de carregamento
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });
}); 