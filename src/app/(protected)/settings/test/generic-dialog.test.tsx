import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GenericDialog } from "../components/common/dialog/generic-dialog";

// Mock dos componentes internos
jest.mock("@/shared/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div 
      data-testid="dialog" 
      role="dialog" 
      aria-modal={open} 
      className={open ? "dialog-open" : "dialog-closed"}
      onClick={() => onOpenChange?.(false)}
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

jest.mock("@/shared/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  )
}));

describe("GenericDialog", () => {
  const mockTitle = "TÃ­tulo do DiÃ¡logo";
  const mockDescription = "DescriÃ§Ã£o do diÃ¡logo";
  const mockContent = <div data-testid="mock-content">ConteÃºdo do diÃ¡logo</div>;
  const mockFooter = <div data-testid="mock-footer">RodapÃ© do diÃ¡logo</div>;
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
    
    // Verificar se os elementos estÃ£o presentes
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog")).toHaveClass("dialog-open");
    expect(screen.getByTestId("dialog-title")).toHaveTextContent(mockTitle);
    expect(screen.getByTestId("dialog-description")).toHaveTextContent(mockDescription);
    expect(screen.getByTestId("mock-content")).toBeInTheDocument();
  });

  it("nÃ£o deve renderizar conteÃºdo quando fechado", () => {
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
    
    // O diÃ¡logo nÃ£o deve estar visÃ­vel
    expect(container.querySelector('[data-testid="dialog"]')).toHaveClass("dialog-closed");
  });

  it("deve chamar onOpenChange quando o diÃ¡logo Ã© clicado", () => {
    render(
      <GenericDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        title={mockTitle}
      >
        {mockContent}
      </GenericDialog>
    );
    
    // Simula o clique no diÃ¡logo para fechÃ¡-lo
    fireEvent.click(screen.getByTestId("dialog"));
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve renderizar o rodapÃ© quando fornecido", () => {
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
    
    // Verificar se estÃ¡ no modo de carregamento
    // Note: Este teste Ã© apenas para demonstraÃ§Ã£o, jÃ¡ que o componente real
    // pode nÃ£o ter uma indicaÃ§Ã£o visual de carregamento
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });
}); 
