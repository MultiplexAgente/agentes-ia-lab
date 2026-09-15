-- =====================================================================================
-- MIGRATION: 004_memory_enterprise.sql
-- DESCRIÇÃO: Memória Empresarial — Expansão do agent_memory para suportar
--            temporalidade, visibilidade, confiança, auditoria e resolução de entidades
-- =====================================================================================

-- 1. EXPANDIR a tabela agent_memory existente com novos campos
ALTER TABLE agent_memory
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS memory_type_v2 VARCHAR(50) DEFAULT 'CUSTOMER',
  -- memory_type_v2: CUSTOMER | OPERATIONAL | PREFERENCE | CONTEXT | BEHAVIOR
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100),
  -- entity_type: customer | order | service | vehicle | appointment | payment
  ADD COLUMN IF NOT EXISTS entity_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS value_json JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(20) DEFAULT 'MEDIUM',
  -- HIGH | MEDIUM | LOW | UNCERTAIN
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'conversation',
  -- conversation | system | admin | document | inference
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(30) DEFAULT 'INTERNAL',
  -- INTERNAL | CUSTOMER_VISIBLE | RESTRICTED
  ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT TRUE;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_agent_memory_is_current ON agent_memory(customer_id, company_id, is_current);
CREATE INDEX IF NOT EXISTS idx_agent_memory_entity ON agent_memory(company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type_v2 ON agent_memory(company_id, customer_id, memory_type_v2);
CREATE INDEX IF NOT EXISTS idx_agent_memory_valid ON agent_memory(valid_until) WHERE valid_until IS NOT NULL;

-- 2. AUDITORIA DE MEMÓRIA — Registro de todas as operações
CREATE TABLE IF NOT EXISTS agent_memory_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES agent_memory(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  action VARCHAR(30) NOT NULL,
  -- CREATED | UPDATED | INVALIDATED | EXPIRED | MERGED
  previous_value TEXT,
  previous_value_json JSONB,
  new_value TEXT,
  new_value_json JSONB,
  reason TEXT,
  source VARCHAR(50) DEFAULT 'system',
  performed_by VARCHAR(255) DEFAULT 'system',
  -- 'system', 'agent', 'admin', 'human_operator'
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_audit_memory ON agent_memory_audit(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_audit_company ON agent_memory_audit(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_audit_customer ON agent_memory_audit(customer_id, created_at DESC);

-- 3. ENTITY RESOLUTION CACHE — Cache de resolução de entidades
--    Relaciona identificadores externos ao customer_id canônico
CREATE TABLE IF NOT EXISTS entity_resolution_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  identifier_type VARCHAR(50) NOT NULL,
  -- 'phone', 'whatsapp_id', 'instagram_id', 'facebook_id', 'telegram_id', 'email', 'name_approx'
  identifier_value VARCHAR(255) NOT NULL,
  confidence_level VARCHAR(20) DEFAULT 'HIGH',
  is_ambiguous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_entity_resolution UNIQUE (company_id, identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_entity_resolution_lookup
  ON entity_resolution_cache(company_id, identifier_type, identifier_value);

-- 4. RLS
ALTER TABLE agent_memory_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_resolution_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for agent_memory_audit" ON agent_memory_audit;
CREATE POLICY "Tenant isolation for agent_memory_audit"
  ON agent_memory_audit FOR ALL
  USING (company_id IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation for entity_resolution_cache" ON entity_resolution_cache;
CREATE POLICY "Tenant isolation for entity_resolution_cache"
  ON entity_resolution_cache FOR ALL
  USING (company_id IS NOT NULL);

-- 5. FUNÇÃO para expirar memórias vencidas automaticamente
CREATE OR REPLACE FUNCTION expire_stale_memories()
RETURNS void AS $$
BEGIN
  UPDATE agent_memory
  SET is_current = FALSE
  WHERE is_current = TRUE
    AND valid_until IS NOT NULL
    AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
