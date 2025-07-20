// Interface do Resource2
export interface Resource2 {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Serviço do Resource2
export class Resource2Service {
  async create(data: Partial<Resource2>): Promise<Resource2> {
    // Implementação
    throw new Error("Not implemented");
  }

  async findById(id: string): Promise<Resource2 | null> {
    // Implementação
    throw new Error("Not implemented");
  }

  async update(id: string, data: Partial<Resource2>): Promise<Resource2> {
    // Implementação
    throw new Error("Not implemented");
  }

  async delete(id: string): Promise<void> {
    // Implementação
    throw new Error("Not implemented");
  }
} 