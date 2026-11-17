-- =====================================================================================
-- MIGRATION (DOCUMENTAL): 007_bonasoft_company_multi_segments.sql
-- DESCRIÇÃO: Suporte a Múltiplos Segmentos Comerciais por Empresa e Filiais
--            Permite que uma mesma empresa opere múltiplos segmentos (ex: mercado + padaria)
--            e prepara o modelo de estoque por filial sem executar no banco.
-- STATUS: NÃO EXECUTADA - ARQUIVO DOCUMENTAL PARA EVOLUÇÃO PLANEJADA DO ERP
-- =====================================================================================

-- 1. EXTENSÃO DA TABELA DE EMPRESAS (TENANTS) PARA SUPORTAR MÚLTIPLOS SEGMENTOS
ALTER TABLE IF EXISTS companies
    ADD COLUMN IF NOT EXISTS secondary_segments TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN companies.secondary_segments IS 
'Lista de segmentos secundários adicionais autorizados para a empresa (ex: supermercado pode ter food_service para lanchonete/padaria e pharmacy para drogaria integrada).';

-- 2. TABELA DE FILIAIS DA EMPRESA (PREPARAÇÃO DE MULTI-FILIAL)
CREATE TABLE IF NOT EXISTS company_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Código interno ou número da loja (ex: 'LOJA-01')
    cnpj VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    address_street VARCHAR(255),
    address_number VARCHAR(50),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zip VARCHAR(20),
    is_headquarters BOOLEAN DEFAULT FALSE, -- Matriz
    active BOOLEAN DEFAULT TRUE,
    authorized_segments TEXT[] DEFAULT '{}'::text[], -- Segmentos que esta filial em específico opera
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_branches_company ON company_branches(company_id);

-- 3. TABELA DE ESTOQUE POR FILIAL (PREPARAÇÃO DO ESTOQUE AVANÇADO)
CREATE TABLE IF NOT EXISTS branch_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES company_branches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    current_stock NUMERIC(12, 3) DEFAULT 0,
    min_stock NUMERIC(12, 3) DEFAULT 0,
    reserved_stock NUMERIC(12, 3) DEFAULT 0, -- Estoque reservado em pedidos pendentes
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_branch_product_stock UNIQUE (branch_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_stock_company ON branch_stock(company_id);
CREATE INDEX IF NOT EXISTS idx_branch_stock_product ON branch_stock(product_id);

-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS) PARA FILIAIS E ESTOQUE
ALTER TABLE company_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_stock ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'company_branches' AND policyname = 'branches_tenant_isolation'
    ) THEN
        CREATE POLICY branches_tenant_isolation ON company_branches
            FOR ALL
            USING (company_id = auth.uid() OR company_id IN (
                SELECT company_id FROM company_users WHERE user_id = auth.uid() AND active = true
            ));
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'branch_stock' AND policyname = 'branch_stock_tenant_isolation'
    ) THEN
        CREATE POLICY branch_stock_tenant_isolation ON branch_stock
            FOR ALL
            USING (company_id = auth.uid() OR company_id IN (
                SELECT company_id FROM company_users WHERE user_id = auth.uid() AND active = true
            ));
    END IF;
END $$;
