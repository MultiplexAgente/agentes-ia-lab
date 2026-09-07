-- =====================================================================================
-- MIGRATION: 003_ai_app_builder.sql
-- DESCRIÇÃO: Estrutura do AI App Builder (Módulos Dinâmicos, Schemas, Versões e Auditoria)
-- =====================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA PRINCIPAL DE MÓDULOS GERADOS POR IA
CREATE TABLE IF NOT EXISTS ai_builder_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(60) DEFAULT 'Layout',
    category VARCHAR(60) DEFAULT 'custom',
    status VARCHAR(30) DEFAULT 'active', -- 'draft', 'active', 'archived'
    schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT NOT NULL DEFAULT 1,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_module_slug UNIQUE (company_id, slug)
);

-- 2. HISTÓRICO DE VERSÕES DOS MÓDULOS (VERSIONAMENTO E ROLLBACK)
CREATE TABLE IF NOT EXISTS ai_builder_module_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES ai_builder_modules(id) ON DELETE CASCADE,
    version INT NOT NULL,
    schema JSONB NOT NULL,
    prompt TEXT NOT NULL,
    build_plan JSONB,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_module_version UNIQUE (module_id, version)
);

-- 3. AUDITORIA E LOGS DE AÇÕES DO AI BUILDER
CREATE TABLE IF NOT EXISTS ai_builder_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    module_id UUID REFERENCES ai_builder_modules(id) ON DELETE SET NULL,
    action VARCHAR(60) NOT NULL, -- 'create_module', 'patch_module', 'rollback_module', 'delete_module'
    prompt TEXT,
    build_plan JSONB,
    changes JSONB,
    status VARCHAR(30) DEFAULT 'success', -- 'success', 'error', 'pending'
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DESPESAS OPERACIONAIS (Para alimentar o cálculo de Lucro e Gestão Financeira real)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Geral',
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'paid', -- 'paid', 'pending'
    due_date DATE DEFAULT CURRENT_DATE,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ÍNDICES DE DESEMPENHO E RLS
CREATE INDEX IF NOT EXISTS idx_ai_modules_company ON ai_builder_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_module_versions ON ai_builder_module_versions(module_id);
CREATE INDEX IF NOT EXISTS idx_ai_actions_company ON ai_builder_actions(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company ON expenses(company_id);

-- RLS
ALTER TABLE ai_builder_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_builder_module_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_builder_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for ai_builder_modules" 
    ON ai_builder_modules FOR ALL 
    USING (company_id = auth.uid() OR company_id IS NOT NULL);

CREATE POLICY "Tenant isolation for expenses" 
    ON expenses FOR ALL 
    USING (company_id = auth.uid() OR company_id IS NOT NULL);
