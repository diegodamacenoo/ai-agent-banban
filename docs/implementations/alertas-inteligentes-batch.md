# 🤖 Implementação dos Alertas Inteligentes - Abordagem B

**Data**: Janeiro/2025  
**Abordagem**: Batch analítico + insights sob demanda  
**Processamento**: ETL noturno às 01:00  

---

## 📋 **VISÃO GERAL**

Os alertas inteligentes serão processados em **lote noturno** às 01:00, analisando dados do dia anterior e gerando insights agregados para o **Morning Brief**. Não há processamento em tempo real.

### **Fluxo Principal**
1. **01:00** - ETL noturno processa dados das tabelas `core_*`
2. **01:30** - Análises de alertas são executadas
3. **02:00** - Dados agregados salvos em tabelas `mart_*`
4. **07:00** - Email "Daily Digest" enviado aos usuários

---

## 🎯 **ALERTAS IMPLEMENTADOS**

### **1. Produtos Parados (Sem Movimento)**
**Objetivo**: Detectar produtos sem vendas por X dias configuráveis

```sql
-- Tabela de controle
CREATE TABLE IF NOT EXISTS mart_stagnant_products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    days_without_movement integer NOT NULL,
    last_movement_date date,
    current_stock integer NOT NULL,
    suggested_action text,
    created_at timestamptz DEFAULT now()
);
```

**Regra de negócio**:
- Produtos sem movimentação de `SALE` por mais de N dias (configurável em settings)
- Apenas produtos com estoque > 0
- Sugestões: promoção, transferência, liquidação

### **2. Reposição Inteligente**
**Objetivo**: Alertar quando estoque atingir cobertura mínima

```sql
-- Tabela de alertas de reposição
CREATE TABLE IF NOT EXISTS mart_replenishment_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    current_stock integer NOT NULL,
    avg_daily_sales numeric(8,2) NOT NULL,
    coverage_days numeric(5,1) NOT NULL,
    min_coverage_threshold integer NOT NULL,
    suggested_qty integer NOT NULL,
    priority_level text CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    created_at timestamptz DEFAULT now()
);
```

**Regra de negócio**:
- Calcular vendas médias dos últimos 30 dias
- Cobertura atual = estoque_atual / venda_média_diária
- Alertar quando cobertura < threshold configurado

### **3. Divergências ERP vs Físico**
**Objetivo**: Detectar diferenças na conferência

```sql
-- Tabela de divergências
CREATE TABLE IF NOT EXISTS mart_inventory_divergences (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    expected_qty numeric NOT NULL,
    scanned_qty numeric NOT NULL,
    difference_qty numeric NOT NULL,
    difference_percentage numeric(5,2) NOT NULL,
    total_value_impact numeric(10,2) NOT NULL,
    severity text CHECK (severity IN ('low', 'medium', 'high')),
    created_at timestamptz DEFAULT now()
);
```

**Fonte**: Análise da coluna `qty_scanned_diff` em `core_document_items`

### **4. Otimização de Margem**
**Objetivo**: Identificar produtos com margem abaixo do mínimo

```sql
-- Tabela de alertas de margem
CREATE TABLE IF NOT EXISTS mart_margin_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    current_price numeric(10,2) NOT NULL,
    cost_price numeric(10,2) NOT NULL,
    current_margin_pct numeric(5,2) NOT NULL,
    min_acceptable_margin_pct numeric(5,2) NOT NULL,
    suggested_price numeric(10,2) NOT NULL,
    potential_revenue_impact numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);
```

### **5. Picos de Devolução**
**Objetivo**: Detectar aumento anormal em devoluções

```sql
-- Tabela de alertas de devolução
CREATE TABLE IF NOT EXISTS mart_return_spike_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    location_id uuid NOT NULL REFERENCES core_locations(id),
    returns_last_7_days integer NOT NULL,
    returns_previous_7_days integer NOT NULL,
    increase_percentage numeric(5,2) NOT NULL,
    total_return_value numeric(10,2) NOT NULL,
    suggested_investigation text,
    created_at timestamptz DEFAULT now()
);
```

### **6. Redistribuição Entre Lojas**
**Objetivo**: Sugerir transferências para otimizar estoque

```sql
-- Tabela de sugestões de redistribuição
CREATE TABLE IF NOT EXISTS mart_redistribution_suggestions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_date date NOT NULL,
    variant_id uuid NOT NULL REFERENCES core_product_variants(id),
    source_location_id uuid NOT NULL REFERENCES core_locations(id),
    target_location_id uuid NOT NULL REFERENCES core_locations(id),
    source_excess_qty integer NOT NULL,
    target_shortage_qty integer NOT NULL,
    suggested_transfer_qty integer NOT NULL,
    priority_score numeric(5,2) NOT NULL,
    estimated_revenue_gain numeric(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **1. Edge Function para ETL Noturno**

```typescript
// supabase/functions/daily-etl/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const analysisDate = new Date().toISOString().split('T')[0];
    
    // 1. Limpar dados do dia anterior (se necessário)
    await cleanupPreviousAnalysis(analysisDate);
    
    // 2. Executar análises
    await analyzeStagnantProducts(analysisDate);
    await analyzeReplenishmentNeeds(analysisDate);
    await analyzeInventoryDivergences(analysisDate);
    await analyzeMarginOptimization(analysisDate);
    await analyzeReturnSpikes(analysisDate);
    await suggestRedistribution(analysisDate);
    
    // 3. Gerar resumo para dashboard
    await generateDashboardSummary(analysisDate);
    
    // 4. Preparar dados para Daily Digest
    await prepareDailyDigest(analysisDate);
    
    return new Response(JSON.stringify({ 
      success: true, 
      analysisDate,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error('Erro no ETL:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
```

### **2. Funções de Análise**

```typescript
// Análise de produtos parados
async function analyzeStagnantProducts(analysisDate: string) {
  const query = `
    WITH last_sales AS (
      SELECT 
        v.id as variant_id,
        m.location_id,
        MAX(m.movement_ts::date) as last_sale_date,
        s.qty_on_hand
      FROM core_product_variants v
      LEFT JOIN core_movements m ON v.id = m.variant_id 
        AND m.movement_type = 'SALE'
        AND m.movement_ts >= CURRENT_DATE - INTERVAL '90 days'
      LEFT JOIN core_inventory_snapshots s ON v.id = s.variant_id
        AND s.snapshot_ts = (
          SELECT MAX(snapshot_ts) 
          FROM core_inventory_snapshots s2 
          WHERE s2.variant_id = v.id AND s2.location_id = m.location_id
        )
      WHERE s.qty_on_hand > 0
      GROUP BY v.id, m.location_id, s.qty_on_hand
    )
    INSERT INTO mart_stagnant_products 
    (analysis_date, variant_id, location_id, days_without_movement, last_movement_date, current_stock, suggested_action)
    SELECT 
      $1::date,
      variant_id,
      location_id,
      CASE 
        WHEN last_sale_date IS NULL THEN 90
        ELSE (CURRENT_DATE - last_sale_date)::integer
      END as days_without_movement,
      last_sale_date,
      qty_on_hand,
      CASE 
        WHEN (CURRENT_DATE - COALESCE(last_sale_date, CURRENT_DATE - INTERVAL '90 days'))::integer > 60 THEN 'liquidation'
        WHEN (CURRENT_DATE - COALESCE(last_sale_date, CURRENT_DATE - INTERVAL '90 days'))::integer > 30 THEN 'promotion'
        ELSE 'transfer'
      END as suggested_action
    FROM last_sales
    WHERE (CURRENT_DATE - COALESCE(last_sale_date, CURRENT_DATE - INTERVAL '90 days'))::integer >= 
          (SELECT idle_product_threshold_days FROM organization_settings LIMIT 1);
  `;
  
  await supabase.rpc('execute_sql', { query, params: [analysisDate] });
}
```

### **3. Cron Job com Supabase**

```sql
-- Configurar cron job no Supabase
SELECT cron.schedule(
  'daily-etl-job',
  '0 1 * * *', -- Todo dia às 01:00
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/daily-etl',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'
  );
  $$
);
```

### **4. Dashboard de Alertas**

```typescript
// src/app/(protected)/alertas/page.tsx
export default async function AlertasPage() {
  const supabase = createSupabaseClient();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar todos os alertas do dia
  const { data: stagnantProducts } = await supabase
    .from('mart_stagnant_products')
    .select(`
      *,
      core_product_variants!inner(
        size, color,
        core_products!inner(product_name, category)
      ),
      core_locations!inner(location_name)
    `)
    .eq('analysis_date', today)
    .order('days_without_movement', { ascending: false });
    
  const { data: replenishmentAlerts } = await supabase
    .from('mart_replenishment_alerts')
    .select(`
      *,
      core_product_variants!inner(
        size, color,
        core_products!inner(product_name)
      ),
      core_locations!inner(location_name)
    `)
    .eq('analysis_date', today)
    .order('priority_level', { ascending: true });
    
  // ... outras consultas de alertas

  return (
    <div className="p-6 space-y-6">
      <AlertSection 
        title="Produtos Parados"
        data={stagnantProducts}
        type="stagnant"
      />
      <AlertSection 
        title="Reposição Necessária"
        data={replenishmentAlerts}
        type="replenishment"
      />
      {/* ... outras seções */}
    </div>
  );
}
```

---

## 📧 **DAILY DIGEST**

### **Edge Function para Email**

```typescript
// supabase/functions/daily-digest/index.ts
serve(async (req) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar resumo de alertas
  const alertsSummary = await generateAlertsSummary(today);
  
  // Buscar KPIs do dia anterior
  const kpis = await getDailyKPIs(today);
  
  // Gerar HTML do email
  const emailHTML = generateDailyDigestHTML(alertsSummary, kpis);
  
  // Enviar para usuários ativos
  const users = await getActiveUsers();
  
  for (const user of users) {
    await sendEmail({
      to: user.email,
      subject: `Daily Digest - ${formatDate(today)}`,
      html: emailHTML
    });
  }
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

## 🚀 **CRONOGRAMA DE IMPLEMENTAÇÃO**

### **Semana 1**
- ✅ Criar tabelas `mart_*` para alertas
- ✅ Implementar Edge Function `daily-etl`
- ✅ Desenvolver função de produtos parados
- ✅ Desenvolver função de reposição

### **Semana 2**
- ✅ Implementar alertas de divergência
- ✅ Implementar alertas de margem
- ✅ Implementar detecção de picos de devolução
- ✅ Configurar cron job

### **Semana 3**
- ✅ Implementar sugestões de redistribuição
- ✅ Criar dashboard de alertas
- ✅ Implementar Daily Digest por email
- ✅ Testes e validação

### **Semana 4**
- ✅ Configurações avançadas de thresholds
- ✅ Relatórios de eficácia dos alertas
- ✅ Otimizações de performance
- ✅ Deploy e monitoramento

---

## 📊 **MÉTRICAS DE SUCESSO**

### **Produtos Parados**
- Meta: Reduzir produtos sem movimento de 30 para 15 dias médios
- KPI: % de produtos com movimento após alertas

### **Reposição**
- Meta: Reduzir rupturas de estoque em 40%
- KPI: % de alertas que resultaram em reposição

### **Margem**
- Meta: Aumentar margem média em 2-3%
- KPI: Valor adicional capturado por ajustes de preço

### **Redistribuição**
- Meta: Reduzir estoque parado em lojas de baixo giro
- KPI: % de transferências sugeridas que foram executadas

---

## 🔧 **CONFIGURAÇÕES DISPONÍVEIS**

Todas as configurações ficam na tabela `organization_settings`:

```sql
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS alert_settings JSONB DEFAULT '{
  "stagnant_product_threshold_days": 30,
  "min_stock_coverage_days": 15,
  "margin_threshold_percentage": 20,
  "return_spike_threshold_percentage": 50,
  "daily_digest_enabled": true,
  "daily_digest_time": "07:00"
}'::jsonb;
```

**Interface no Settings**:
- Dias para produto parado
- Cobertura mínima de estoque  
- Margem mínima aceitável
- Threshold para pico de devoluções
- Horário do Daily Digest

---

## ✅ **PRÓXIMOS PASSOS**

1. **Executar script de criação das tabelas** `mart_*`
2. **Implementar Edge Function** `daily-etl`
3. **Configurar cron job** no Supabase
4. **Criar dashboard** de alertas
5. **Implementar Daily Digest** por email
6. **Configurar alertas** nas Settings

O sistema estará **operacional** e processando alertas automaticamente todas as noites, fornecendo insights valiosos para a gestão de estoque da BanBan. 