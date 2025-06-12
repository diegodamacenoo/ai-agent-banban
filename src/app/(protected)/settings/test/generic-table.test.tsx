import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GenericTable } from "../components/common/table/generic-table";

// Mock dos componentes internos
jest.mock("@/components/ui/table", () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid={`button-${props.variant || 'default'}`} {...props}>
      {children}
    </button>
  )
}));

describe("GenericTable", () => {
  // Dados de teste
  const mockData = [
    { id: "1", nome: "Item 1", descricao: "Descrição do item 1" },
    { id: "2", nome: "Item 2", descricao: "Descrição do item 2" },
    { id: "3", nome: "Item 3", descricao: "Descrição do item 3" },
  ];

  const mockColumns = [
    {
      header: "Nome",
      cell: (row: any) => row.nome,
    },
    {
      header: "Descrição",
      cell: (row: any) => row.descricao,
    },
  ];

  const mockActionClick = jest.fn();
  const mockActions = [
    {
      label: "Editar",
      icon: () => <span>📝</span>,
      onClick: mockActionClick,
    },
    {
      label: "Remover",
      icon: () => <span>🗑️</span>,
      onClick: mockActionClick,
      disabled: (row: any) => row.id === "3", // Desabilita para o item 3
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve renderizar corretamente uma tabela vazia", () => {
    render(<GenericTable data={[]} columns={mockColumns} />);
    
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("table-header")).toBeInTheDocument();
    expect(screen.getByTestId("table-body")).toBeInTheDocument();
    
    // Verificar cabeçalhos
    mockColumns.forEach(column => {
      expect(screen.getByText(column.header)).toBeInTheDocument();
    });
  });

  it("deve renderizar dados corretamente", () => {
    render(<GenericTable data={mockData} columns={mockColumns} />);
    
    // Verificar se todos os dados estão presentes
    mockData.forEach(item => {
      expect(screen.getByText(item.nome)).toBeInTheDocument();
      expect(screen.getByText(item.descricao)).toBeInTheDocument();
    });
  });

  it("deve renderizar ações corretamente", () => {
    render(<GenericTable data={mockData} columns={mockColumns} actions={mockActions} />);
    
    // Verificar botões de ação para cada linha
    const editarButtons = screen.getAllByText("Editar");
    const removerButtons = screen.getAllByText("Remover");
    
    expect(editarButtons).toHaveLength(mockData.length);
    expect(removerButtons).toHaveLength(mockData.length);
  });

  it("deve chamar a função de ação corretamente", () => {
    render(<GenericTable data={mockData} columns={mockColumns} actions={mockActions} />);
    
    // Clica no primeiro botão "Editar"
    const editarButtons = screen.getAllByText("Editar");
    fireEvent.click(editarButtons[0]);
    
    expect(mockActionClick).toHaveBeenCalledWith(mockData[0]);
  });

  it("deve desabilitar botões conforme a regra definida", () => {
    render(<GenericTable data={mockData} columns={mockColumns} actions={mockActions} />);
    
    const removerButtons = screen.getAllByText("Remover");
    
    // O botão para o item 3 deve estar desabilitado
    expect(removerButtons[2]).toBeDisabled();
    
    // Os outros botões não devem estar desabilitados
    expect(removerButtons[0]).not.toBeDisabled();
    expect(removerButtons[1]).not.toBeDisabled();
  });

  it("deve aplicar classes adicionais", () => {
    const className = "custom-class";
    const { container } = render(
      <GenericTable 
        data={mockData} 
        columns={mockColumns} 
        className={className} 
      />
    );
    
    // Verifica se a classe foi aplicada ao elemento raiz
    expect(container.firstChild).toHaveClass(className);
  });
}); 