-- =====================================================================================
-- MIGRATION: 005_catalog_universal.sql
-- DESCRIÇÃO: Catálogo Universal — Tabelas de analytics + índices de performance
--            para suportar todos os segmentos de negócio
-- =====================================================================================

-- 1. CATÁLOGO DE PESQUISAS — Telemetria de buscas reais
CREATE TABLE IF NOT EXISTS catalog_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  query TEXT,
  category VARCHAR(100),
  entity_type VARCHAR(50),
  -- product | property | vehicle | restaurant | service | hotel | course | job | event | agro
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  results_shown_ids TEXT[] DEFAULT '{}',
  is_alternative BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_searches_company ON catalog_searches(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_searches_entity ON catalog_searches(company_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_catalog_searches_customer ON catalog_searches(customer_id, created_at DESC);

-- 2. CLIQUES EM ITENS DE CATÁLOGO — Telemetria de engajamento
CREATE TABLE IF NOT EXISTS catalog_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  catalog_item_id VARCHAR(255) NOT NULL,
  item_name VARCHAR(500),
  item_entity_type VARCHAR(50),
  source_url TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalog_clicks_company ON catalog_clicks(company_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_clicks_item ON catalog_clicks(company_id, catalog_item_id);

-- 3. ÍNDICES EXTRAS na tabela normalized_catalog_items (se existir com esse nome)
-- Compatibilidade: a tabela pode ter sido criada em 001_initial_schema.sql
DO $$
BEGIN
  -- Índice por entity_type para filtro universal
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'normalized_catalog_items') THEN
    CREATE INDEX IF NOT EXISTS idx_catalog_items_entity_type
      ON normalized_catalog_items(company_id, item_type, status);
    CREATE INDEX IF NOT EXISTS idx_catalog_items_price
      ON normalized_catalog_items(company_id, price) WHERE price IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_catalog_items_availability
      ON normalized_catalog_items(company_id, status);
  END IF;
END $$;

-- 4. RLS
ALTER TABLE catalog_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for catalog_searches" ON catalog_searches;
CREATE POLICY "Tenant isolation for catalog_searches"
  ON catalog_searches FOR ALL
  USING (company_id IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation for catalog_clicks" ON catalog_clicks;
CREATE POLICY "Tenant isolation for catalog_clicks"
  ON catalog_clicks FOR ALL
  USING (company_id IS NOT NULL);

-- 5. VIEW analítica útil — Resumo de buscas por empresa e segmento
CREATE OR REPLACE VIEW catalog_search_analytics AS
SELECT
  company_id,
  entity_type,
  COUNT(*) AS total_searches,
  AVG(results_count) AS avg_results,
  COUNT(CASE WHEN results_count = 0 THEN 1 END) AS zero_result_searches,
  DATE_TRUNC('day', created_at) AS search_date
FROM catalog_searches
GROUP BY company_id, entity_type, DATE_TRUNC('day', created_at);
