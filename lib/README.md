# Lib Directory

Este diretório contém bibliotecas e utilitários compartilhados da aplicação.

## Estrutura

```
lib/
├── utils/        # Funções utilitárias gerais
├── constants/    # Constantes da aplicação
├── types/        # Tipos TypeScript compartilhados
├── hooks/        # Hooks React customizados
└── api/          # Clientes e wrappers de API
```

## Uso

As bibliotecas neste diretório devem ser:
- Puras (sem efeitos colaterais quando possível)
- Bem tipadas
- Testadas
- Documentadas

## Convenções

- Use TypeScript para todas as funções
- Exporte apenas o que é necessário
- Mantenha funções pequenas e focadas
- Adicione testes unitários

## Nota

Este diretório foi criado para atender aos requisitos de compliance da aplicação. 