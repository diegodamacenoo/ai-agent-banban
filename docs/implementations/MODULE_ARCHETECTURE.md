# Axon – Padrão Completo de Arquitetura e Codificação de Módulos

> **Objetivo** Garantir que todo módulo desenvolvido para a plataforma **Axon** seja plug‑and‑play, seguro, fácil de manter e 100 % compatível com o pipeline de provisionamento, cobrança e analytics descrito no *Plano Consolidado de Gestão de Módulos*.
>
> Este guia define **estrutura de pastas**, **arquivos obrigatórios**, **contratos JSON**, **padrões de banco de dados**, **boas práticas de código** e **checklists de CI/CD**.

---

## 1 Estrutura de Diretórios (referência mínima)

```text
<module-slug>/                # slug kebab‑case único dentro do Axon
  README.md                  # overview + instruções locais
  module.json                # manifesto (metadados & dependências)
  module_schema.json         # contrato de settings (JSON Schema)
  migrations/                # scripts idempotentes
    000_init.sql            
    001_add_idx.sql         
  src/
    index.ts                # entrypoint → register(routes, jobs, hooks)
    api/
      routes.ts            # REST/GraphQL resolvers
      validators.ts        # zod/livro-io schemas
    jobs/
      cron.ts              # scheduler e queues
      events.ts            # event handlers (Supabase Realtime)
    lib/                   # helpers isolados
  tests/
    unit/                  # Jest
    e2e/                   # msw, supertest
  Dockerfile               # container de build
  .env.example             # variáveis padrão
```

> Todos os caminhos são relativos à raiz do monorepo, permitindo que o CI importe pacotes compartilhados (pino, zod, axios‑retry, etc.).

---

## 2 `module.json` – Esquema Obrigatório

| Campo              | Tipo                  | Obrig. | Exemplo                                                 | Descrição                            |
| ------------------ | --------------------- | ------ | ------------------------------------------------------- | ------------------------------------ |
| `name`             | string                | ✅      | "Alert Engine"                                          | Nome amigável exibido no marketplace |
| `slug`             | string                | ✅      | `alert-engine`                                          | Identificador único (kebab‑case)     |
| `version`          | string (SemVer)       | ✅      | `1.0.0`                                                 | Versão do pacote em desenvolvimento  |
| `description`      | string                | ✅      | "Gera alertas de estoque"                               | 140 caracteres máx.                  |
| `min_core_version` | string (SemVer range) | ✅      | `>=0.9.0`                                               | Compatibilidade com Axon Core        |
| `tags`             | string\[]             | —      | `["inventory","alerts"]`                                | Para busca e filtragem               |
| `entrypoint`       | string                | ✅      | `src/index.ts`                                          | Arquivo que exporta `register()`     |
| `migrations`       | string\[]             | ✅      | `["migrations/000_init.sql"]`                           | Ordem de execução                    |
| `schema_file`      | string                | —      | `module_schema.json`                                    | Contrato de settings                 |
| `dependencies`     | object                | —      | `{ "openai": ">=1.1" }`                                 | SDKs externos ou peerDeps            |
| `visibility`       | enum                  | ✅      | `"ALPHA" \| "BETA" \| "GA"`                             | Status default no catálogo           |
| `license`          | string                | ✅      | `"Proprietary"`                                         | Informação legal                     |
| `author`           | object                | ✅      | `{ "name":"FC Dev", "email":"dev@fingerscrossed.work"}` | Contato                              |

O manifesto é validado contra **`core_module_manifest.schema.json`** na etapa *lint‑manifest* do pipeline.

---

## 3 `module_schema.json` – Contrato de Settings

* **Formato**: JSON Schema Draft 2020‑12.
* **Regras**:

  1. Root `type` deve ser `object`;
  2. Todos os campos devem ter `title`, `description` e `examples`;
  3. Campos sensíveis usam `format: "password"` → UI renderiza input seguro;
  4. Campos com escolha limitada usam `enum` ou `const`;
  5. **Versão** do contrato acompanha o `version` do módulo (campo `schema_version`).

Exemplo simplificado:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Alert Engine Settings",
  "type": "object",
  "properties": {
    "threshold": {
      "type": "integer",
      "title": "Estoque mínimo antes do alerta",
      "description": "Quantidade abaixo da qual o alerta é disparado.",
      "minimum": 0,
      "default": 5,
      "examples": [5, 10]
    },
    "email_to": {
      "type": "string",
      "format": "email",
      "title": "E‑mail de notificação",
      "examples": ["alerts@tenant.com"]
    }
  },
  "required": ["threshold", "email_to"]
}
```

---

## 4 Padrões de Banco de Dados

### 4.1 Tabelas Geradas

* Todo script SQL **MUST** iniciar com `SET search_path TO public;` para evitar conflitos.
* Tabelas devem incluir colunas padrão:

  ```sql
  tenant_id    UUID NOT NULL,
  id           BIGSERIAL PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ,
  version      INTEGER NOT NULL DEFAULT 1
  ```
* Índices obrigatórios:

  ```sql
  CREATE INDEX ON <table> (tenant_id, created_at DESC);
  ```
* Aplicar **RLS** sempre com política:

  ```sql
  CREATE POLICY tenant_isolation ON <table>
    USING (tenant_id = auth.jwt() ->> 'tenant_id');
  ```

### 4.2 Migrations

* Numeradas incrementalmente `000_init.sql`, `001_*.sql`…
* Idempotentes com `IF NOT EXISTS` / `ALTER TABLE IF EXISTS`.
* **Para alterações destrutivas** obrigar Major bump; fornecer script `rollback_###.sql`.

---

## 5 Padrões de Código

| Aspecto         | Regra                                | Ferramenta                 |
| --------------- | ------------------------------------ | -------------------------- |
| **Linguagem**   | TypeScript ≥ 5.x                     | ts‑config padrão monorepo  |
| **Estilo**      | Prettier padrão Axon                 | `npm run format`           |
| **Qualidade**   | ESLint – sem `any`, cobertura ≥ 70 % | `npm run lint`; Jest       |
| **Logs**        | Usar `@axon/logger` (pino wrapper)   | Correlation‑ID por request |
| **Erro**        | Só lançar `AxonError` subclasses     | padroniza códigos          |
| **Env Vars**    | Validar com `zod` em `src/env.ts`    | Falha hard se inválido     |
| **Jobs/Queues** | BullMQ; prefixo `tenant:<module>:`   | Escopo por tenant          |

---

## 6 Pipeline CI/CD

1. **lint‑manifest** → valida `module.json` ✓
2. **lint** → ESLint e Prettier✓
3. **test** → Jest (unit + e2e)
4. **build** → tsc && Docker build
5. **scan** → Snyk (vulnerabilidade)
6. **publish** → push image `<registry>/<module>:<version>`
7. **release** → cria registro em `core_module_versions` + anexa `CHANGELOG.md`.

Falha em qualquer etapa = PR bloqueado.

---

## 7 Checklist de Entrega (PR)

* [ ] Estrutura de pastas conforme §1.
* [ ] `module.json` validado.
* [ ] `module_schema.json` documentado.
* [ ] Scripts SQL idempotentes + rollback.
* [ ] Coverage ≥ 70 %.
* [ ] Changelog atualizado.
* [ ] Docker image executa `register()` sem erros.

---

## 8 Exemplo de `src/index.ts`

```ts
import { registerRoutes } from './api/routes';
import { registerJobs } from './jobs/cron';
import type { ModuleContext } from '@axon/core';

export async function register(ctx: ModuleContext) {
  // 1. expõe rotas REST
  registerRoutes(ctx.router, ctx);
  // 2. agenda cron‑jobs
  registerJobs(ctx.scheduler, ctx);
  // 3. registra hooks de upgrade se necessário
  ctx.lifecycle.onUpgrade(async (from, to) => {
    await ctx.db.query('CALL alert_engine_upg($1,$2)', [from, to]);
  });
}
```

---

## 9 Boas Práticas Avançadas

* **Feature Flags** internas (LDK) para liberar funções sem quebrar tenants.
* **Observabilidade**: exportar métricas via OpenTelemetry → aggregator Axon.
* **Chaos/Load Tests** incluídos nos e2e para módulos críticos.
* **Design Tokens**: se expor UI embutida, usar `@axon/tokens` para garantir consistência.

---

### Última atualização • 26 jun 2025 (America/Fortaleza)
