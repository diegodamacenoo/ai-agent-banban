# Axon – Plano Consolidado de Gestão de Módulos

> **Objetivo:** Implantar um ecossistema de módulos plug‑and‑play para clientes (tenants) do Axon, permitindo ativação, cobrança, monitoramento e evolução individual de cada bloco funcional.

---

## 1. Visão Geral

* **Módulo** = pacote funcional autônomo (Ex.: Painel de Estoque, Motor de Alertas, Chatbot).
* **Marketplace interno** para descoberta, ativação e atualização.
* **Multi‑tenant by design**: isolamento lógico por `tenant_id`, prefixos (`core_`, `tenant_`).
* **Monetização**: pay‑as‑you‑go, assinaturas ou free tier controlados por telemetria de uso.

---

## 2. Domínio de Dados (Supabase)

| Tabela                   | Chave                     | Conteúdo Principal                                                              |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| `core_modules`           | `module_id`               | Catálogo mestre (nome, slug, descrição, pricing tier, dependências, maturidade) |
| `core_module_versions`   | `version_id`              | Versões semânticas, build hash, changelog, scripts de migração                  |
| `tenant_modules`         | (tenant\_id + module\_id) | Estado operacional por tenant (ver §4)                                          |
| `tenant_module_settings` | FK → tenant\_modules      | JSONB de parâmetros, validado por `module_schema.json`                          |
| `module_usage_logs`      | FK → tenant\_modules      | Telemetria (rota, tokens, custo estimado, latency)                              |
| `audit_logs`             | –                         | Mutações em settings e lifecycle                                                |

---

2.1 Gestão de Dados dos Módulos

Prefixos & Namespaces: tabelas de catálogo usam core_; dados inquilinos ficam em tenant_; tabelas específicas de um módulo seguem tenant_<module_slug>_ para facilitar limpeza e migração.

Row Level Security (RLS): políticas obrigatórias em todas as tenant_* exigem tenant_id = auth.jwt().tenant_id. As core_* permanecem read‑only para roles de aplicação.

Provisionamento automático:

Job de setup executa migrations/<version>.sql do módulo.

Cria tabelas próprias, índices (tenant_id, created_at) e triggers de auditoria.

Concede privilégios mínimos (SELECT, INSERT, UPDATE) à role tenant_app_role.

Registra artefatos criados em core_module_versions.tables_created (array JSON).

Versionamento de schema: mudanças destrutivas exigem Major bump; scripts pre_upgrade() e post_upgrade() acompanham cada release.

Retenção & Purge: data_retention_days define TTL. Job noturno MODULE_PURGE exporta CSV para storage://tenant_exports/ e remove linhas/partições expiradas.

Backup & Rollback: snapshot PITR do cluster + dump lógico do schema do módulo antes de upgrades major.

Observabilidade: triggers AFTER INSERT/UPDATE enviam eventos para audit_logs; module_usage_logs inclui row_count para estimar custo.

Particionamento & Performance: módulos de alta volumetria usam pg_partman (intervalo mensal) + compressão automática para partições antigas.

Desativação:

DISABLED: congela triggers, mantém dados.

ARCHIVED: executa exportação, dropa tabelas se política LGPD exigir.

---

## 3. Ciclo de Vida ‑ Catálogo (Maturidade Global)

| Fase            | Status              | Uso                                         |
| --------------- | ------------------- | ------------------------------------------- |
| Planejamento    | **PLANNED**         | Ideia aprovada, sem código                  |
| Desenvolvimento | **IN\_DEVELOPMENT** |                                             |
| Teste interno   | **ALPHA**           | Somente devs/early adopters internos        |
| Teste externo   | **BETA**            | Tenants opt‑in, mudanças breaking possíveis |
| Pré‑lançamento  | **RC**              |                                             |
| Disponível      | **GA**              | Padrão para novos tenants                   |
| Manutenção      | **MAINTENANCE**     | Apenas patches                              |
| Obsoleto        | **DEPRECATED**      | Sucessor disponível, data de sunset         |
| Retirado        | **RETIRED**         | Removido do Axon                            |

**Fluxo:** `PLANNED → IN_DEVELOPMENT → ALPHA → BETA → RC → GA → MAINTENANCE → DEPRECATED → RETIRED`

---

## 4. Ciclo de Vida ‑ Operacional por Tenant

| Fase        | Status                | Significado                            |
| ----------- | --------------------- | -------------------------------------- |
| Solicitação | **REQUESTED**         | Tenant clicou *Enable*                 |
| Aprovação   | **PENDING\_APPROVAL** | Aguardando aprovação humana ou crédito |
| Setup       | **PROVISIONING**      | Infra, tabelas, chaves                 |
| Ativo       | **ENABLED**           | Pronto para uso                        |
| Atualização | **UPGRADING**         | Executando scripts de upgrade          |
| Saudável    | **UP\_TO\_DATE**      | Última versão GA                       |
| Suspenso    | **SUSPENDED**         | Pagamento/límites                      |
| Desativado  | **DISABLED**          | Desligado pelo tenant                  |
| Arquivado   | **ARCHIVED**          | Dados exportados/purgados              |
| Problema    | **ERROR**             | Falha de setup/upgrade                 |

**Fluxo resumido:** `REQUESTED → PENDING_APPROVAL → PROVISIONING → ENABLED ↔ UPGRADING → DISABLED/SUSPENDED → ARCHIVED`.

---

### 4.1 Mapeamento Catálogo × Tenant (Disponibilidade)

| Status no Catálogo  | Exibido no Marketplace? | Tenant pode **solicitar**? | Condições / Política                                                                                              |
| ------------------- | ----------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **PLANNED**         | Não                     | Não                        | Ideia ainda sem código                                                                                            |
| **IN\_DEVELOPMENT** | Não                     | Não                        | Acesso só para dev‑team                                                                                           |
| **ALPHA**           | Opcional\*              | Raramente                  | \*Visível apenas para tenants marcados como *internal‑tester*; requer aprovação do Super Admin e aviso "sem SLA"  |
| **BETA**            | Sim (badge *Beta*)      | Sim (opt‑in)               | Termo de Beta + possibilidade de breaking‑changes                                                                 |
| **RC**              | Sim                     | Sim                        | Tratado como estável; upgrade rápido para GA                                                                      |
| **GA**              | Sim (padrão)            | Sim                        | Estado "Estável" no catálogo                                                                                      |
| **MAINTENANCE**     | Sim (badge *Legacy*)    | Sim (com alerta)           | Não recomendado para novos projetos, mas permitido                                                                |
| **DEPRECATED**      | Oculto (por padrão)\*\* | Não para novos             | **Se "Mostrar legados" habilitado, aparece com alerta; Tenants existentes continuam, sistema recomenda migração** |
| **RETIRED**         | Não                     | Não                        | Módulo removido; somente dados de tenants antigos em processo de arquivamento                                     |

> *Essas regras são aplicadas pelo backend do marketplace para controlar o botão ************Enable************ e qualquer fluxo de aprovação.*
>
> **Atenção:** quando um módulo muda de *GA* → *DEPRECATED* ou *RETIRED*, o sistema dispara webhooks de notificação para todos os tenants impactados e atualiza automaticamente o **Tenant Status** para:
>
> * **DISABLED** (se *RETIRED* e módulo já estava desligado) ou
> * **SUSPENDED** (se abandono for forçado por política).

## 5. Papéis & Permissões (RBAC)

| Papel            | Capacidades                                             |
| ---------------- | ------------------------------------------------------- |
| **Master Admin** | CRUD de módulos, publicar versões, ver todos os tenants |
| **Tenant Admin** | Ativar/Desativar, editar settings, ver billing          |
| **Tenant User**  | Consumir APIs/UI do módulo                              |

---

## 6. APIs Internas

| Verbo | Rota                                      | Função                     |
| ----- | ----------------------------------------- | -------------------------- |
| GET   | `/api/modules`                            | Catálogo global            |
| POST  | `/api/tenant/:id/modules`                 | Solicitar habilitação      |
| PATCH | `/api/tenant/:id/modules/:moduleId`       | Alterar estado ou settings |
| GET   | `/api/tenant/:id/modules/:moduleId/usage` | Métricas de uso            |

Middleware injeta `tenant_id` pelo JWT; RLS garante isolamento.

---

## 7. UI/UX (Next.js + shadcn)

1. **Página de Gestão de Módulos** – grid de cards (nome, tag, preço, status).
2. **Página de Organizações › Gestão de Módulos** – tabela (estado, versão, última atualização, ações).
3. **Settings Drawer** – auto‑render via `module_schema.json` + validação.
4. **Usage Analytics** – gráfico de chamadas/dia + custo mensal.

---

## 8. Governança & Qualidade

* **SemVer** em `core_module_versions`.
* **CI/CD**: lint, unit, e2e em ambiente staging.
* **Compatibilidade**: matriz (Axon vs Módulo).
* **Changelog.md** obrigatório.
* **Rollback window** configurável (ex.: 48h).

---

## 9. Custos & Billing

* `module_usage_logs` grava custo estimado (`openai_tokens * price_per_token`, etc.).
* Job noturno agrega em `tenant_module_monthly_cost` para fatura.

---

## 10. Segurança & Conformidade

* RLS completo: dados nunca misturam tenants.
* Provisioning jobs executam com roles de privilégio mínimo.
* LGPD: `data_retention_days` por módulo; job de purge.

---
