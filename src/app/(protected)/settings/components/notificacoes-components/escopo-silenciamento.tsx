import { useState } from 'react';
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock de dados iniciais
interface SilencedContext {
  id: string;
  tipo: string; // "sku", "loja", "usuario"
  valor: string;
  descricao: string;
}

export function EscopoSilenciamento() {
  // Estado para lista de contextos silenciados
  const [contextosSilenciados, setContextosSilenciados] = useState<SilencedContext[]>([
    { id: "1", tipo: "sku", valor: "SKU12345", descricao: "Produto X" },
    { id: "2", tipo: "loja", valor: "LOJA-SP-01", descricao: "Loja Centro - São Paulo" }
  ]);

  // Estado para formulário de adição de novo silenciamento
  const [novoContextoTipo, setNovoContextoTipo] = useState("sku");
  const [novoContextoValor, setNovoContextoValor] = useState("");
  const [novoContextoDescricao, setNovoContextoDescricao] = useState("");

  // Função para adicionar novo contexto silenciado
  const adicionarContexto = () => {
    if (!novoContextoValor.trim()) return;

    const novoContexto: SilencedContext = {
      id: Date.now().toString(),
      tipo: novoContextoTipo,
      valor: novoContextoValor,
      descricao: novoContextoDescricao
    };

    setContextosSilenciados([...contextosSilenciados, novoContexto]);
    setNovoContextoValor("");
    setNovoContextoDescricao("");
  };

  // Função para remover um contexto silenciado
  const removerContexto = (id: string) => {
    setContextosSilenciados(contextosSilenciados.filter(ctx => ctx.id !== id));
  };

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-6">
        {/* Adicionar Novo Contexto */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Adicionar Silenciamento</h4>
            <p className="text-sm text-muted-foreground">Silencie notificações para contextos específicos</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo-contexto">Tipo</Label>
                <Select 
                  value={novoContextoTipo} 
                  onValueChange={setNovoContextoTipo}
                >
                  <SelectTrigger id="tipo-contexto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sku">SKU</SelectItem>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="valor-contexto">{novoContextoTipo === "sku" ? "Código SKU" : 
                  novoContextoTipo === "loja" ? "Código da Loja" : "Usuário"}</Label>
                <Input
                  id="valor-contexto"
                  placeholder={novoContextoTipo === "sku" ? "Ex: SKU12345" : 
                    novoContextoTipo === "loja" ? "Ex: LOJA-01" : "Ex: usuario@email.com"}
                  value={novoContextoValor}
                  onChange={(e) => setNovoContextoValor(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <Label>&nbsp;</Label>
                <Button
                  onClick={adicionarContexto}
                  disabled={!novoContextoValor.trim()}
                  className="w-full"
                >
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2 md:col-span-4">
                <Label htmlFor="descricao-contexto">Descrição (opcional)</Label>
                <Input
                  id="descricao-contexto"
                  placeholder="Breve descrição para identificação"
                  value={novoContextoDescricao}
                  onChange={(e) => setNovoContextoDescricao(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Lista de Contextos Silenciados */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h4 className="font-medium">Contextos Silenciados</h4>
            <p className="text-sm text-muted-foreground">Gerenciar contextos atualmente silenciados</p>
          </div>

          <div className="space-y-2">
            {contextosSilenciados.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhum contexto silenciado no momento.</p>
            ) : (
              <div className="space-y-2">
                {contextosSilenciados.map((contexto) => (
                  <div 
                    key={contexto.id} 
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {contexto.tipo === "sku" ? "SKU" : 
                         contexto.tipo === "loja" ? "Loja" : "Usuário"}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{contexto.valor}</p>
                        {contexto.descricao && (
                          <p className="text-xs text-muted-foreground">{contexto.descricao}</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removerContexto(contexto.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Notificações relacionadas a estes contextos serão silenciadas em todos os canais, 
            exceto para alertas críticos de segurança.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 