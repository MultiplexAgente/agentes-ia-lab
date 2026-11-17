-- =====================================================================================
-- MIGRATION (DOCUMENTAL): 008_bonasoft_pdv_and_cash_registers.sql
-- DESCRIÇÃO: Estrutura Completa de Frente de Caixa (PDV), Terminais, Sessões de Caixa,
--            Movimentações (Sangrias/Suprimentos), Descontos e Pagamentos Múltiplos
-- STATUS: NÃO EXECUTADA - ARQUIVO DOCUMENTAL PARA EVOLUÇÃO PLANEJADA DO ERP
-- =====================================================================================

-- 1. TABELA DE TERMINAIS DE CAIXA (PDV)
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES company_branches(id) ON DELETE SET NULL,
    terminal_code VARCHAR(50) NOT NULL, -- Ex: 'PDV-01', 'CAIXA-01'
    name VARCHAR(100) NOT NULL, -- Ex: 'Caixa Rápido Balcão', 'Terminal Loja'
    device_type VARCHAR(50) DEFAULT 'web', -- 'web', 'desktop', 'mobile_pos'
    mac_address VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_terminal UNIQUE (company_id, terminal_code)
);

CREATE INDEX IF NOT EXISTS idx_cash_registers_company ON cash_registers(company_id);

-- 2. TABELA DE SESSÕES DE CAIXA (ABERTURA, FECHAMENTO E AUDITORIA)
CREATE TABLE IF NOT EXISTS cash_sessions (
    id VARCHAR(100) PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    terminal_code VARCHAR(50) NOT NULL,
    operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    operator_email VARCHAR(255) NOT NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'CLOSED'
    initial_cash_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    counted_cash_amount NUMERIC(12, 2),
    expected_cash_amount NUMERIC(12, 2),
    divergence_amount NUMERIC(12, 2), -- Sobra (+) ou Falta (-)
    movements JSONB DEFAULT '[]'::jsonb,
    sales_summary JSONB DEFAULT '{"cashTotal": 0, "creditCardTotal": 0, "debitCardTotal": 0, "pixTotal": 0, "salesCount": 0}'::jsonb,
    closing_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_company_status ON cash_sessions(company_id, status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_terminal ON cash_sessions(company_id, terminal_code);

-- 3. TABELA DE MOVIMENTAÇÕES DE CAIXA (SANGRIA E SUPRIMENTO)
CREATE TABLE IF NOT EXISTS cash_movements (
    id VARCHAR(100) PRIMARY KEY,
    cash_session_id VARCHAR(100) REFERENCES cash_sessions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    terminal_code VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'SANGRIA' (retirada) ou 'SUPRIMENTO' (reforço de troco)
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    operator_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(cash_session_id);

-- 4. ÍNDICES DE DESEMPENHO PARA CONSULTAS RÁPIDAS NO PDV
CREATE INDEX IF NOT EXISTS idx_products_barcode_company ON products(company_id, barcode_ean);
CREATE INDEX IF NOT EXISTS idx_products_sku_company ON products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_orders_pdv_lookup ON orders(company_id, created_at DESC);
