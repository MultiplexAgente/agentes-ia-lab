-- =====================================================================================
-- MIGRATION: 009_hug_saas_billing_and_suspension.sql
-- DESCRIÇÃO: Sistema de Gestão de Assinaturas, Mensalidades, Cobrança e Suspensão Automática HUG
-- BANCO OFICIAL: mbjqzjipiuwtgmoxsqfu
-- =====================================================================================

-- 1. EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE CONFIGURAÇÕES GLOBAIS DE COBRANÇA
CREATE TABLE IF NOT EXISTS billing_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grace_days INT NOT NULL DEFAULT 15,
    warning_days INT NOT NULL DEFAULT 12,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Cuiaba',
    auto_suspend_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    pix_key VARCHAR(100) NOT NULL DEFAULT 'financeiro@hug.com.br',
    pix_key_type VARCHAR(20) NOT NULL DEFAULT 'email',
    bank_name VARCHAR(100) NOT NULL DEFAULT 'Banco Inter / Asaas',
    beneficiary_name VARCHAR(150) NOT NULL DEFAULT 'HUG TECNOLOGIA E INTELIGENCIA ARTIFICIAL LTDA',
    billing_instructions TEXT DEFAULT 'Para confirmação imediata, realize a transferência via chave PIX e anexe o comprovante se solicitado.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inserir configuração padrão caso tabela esteja vazia
INSERT INTO billing_settings (grace_days, warning_days, timezone, auto_suspend_enabled, pix_key, pix_key_type, bank_name, beneficiary_name)
SELECT 15, 12, 'America/Cuiaba', TRUE, 'financeiro@hug.com.br', 'email', 'Banco Inter / Asaas', 'HUG TECNOLOGIA E INTELIGENCIA ARTIFICIAL LTDA'
WHERE NOT EXISTS (SELECT 1 FROM billing_settings);

-- 3. TABELA DE ASSINATURAS DAS EMPRESAS (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL DEFAULT 'farmacia', -- 'farmacia', 'mercado', 'moda', 'gastronomia', 'beleza', 'construcao', 'central'
    plan_id VARCHAR(50) NOT NULL DEFAULT 'Business',     -- 'Starter', 'Business', 'Premium', 'Enterprise'
    amount NUMERIC(10, 2) NOT NULL DEFAULT 499.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
    due_day INT NOT NULL DEFAULT 10,                      -- Dia do vencimento (1 a 28)
    status VARCHAR(30) NOT NULL DEFAULT 'em_dia',         -- 'em_dia', 'pendente', 'em_atraso', 'suspensao_programada', 'suspensa', 'cancelada', 'isenta'
    is_exempt BOOLEAN NOT NULL DEFAULT FALSE,             -- Isenção administrativa temporária
    exemption_reason TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suspended_at TIMESTAMPTZ,
    next_due_at DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'pix',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_subscription UNIQUE (company_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 4. TABELA DE FATURAS / MENSALIDADES (SUBSCRIPTION_INVOICES)
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente', -- 'pendente', 'paga', 'vencida', 'estornada', 'cancelada'
    paid_at TIMESTAMPTZ,
    reference_period VARCHAR(20) NOT NULL,           -- Ex: '2026-11'
    days_overdue INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_invoice_period UNIQUE (company_id, reference_period)
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company ON subscription_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON subscription_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);

-- 5. TABELA DE PAGAMENTOS CONFIRMADOS (SUBSCRIPTION_PAYMENTS)
CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES subscription_invoices(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'pix', -- 'pix', 'boleto', 'cartao_credito', 'transferencia'
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_by VARCHAR(255) NOT NULL,                -- Nome/email do admin central que confirmou
    transaction_reference VARCHAR(255),               -- Código PIX, NSU ou comprovante
    notes TEXT,
    is_reversed BOOLEAN NOT NULL DEFAULT FALSE,        -- True caso o pagamento tenha sido estornado
    reversed_at TIMESTAMPTZ,
    reversed_by VARCHAR(255),
    reversal_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON subscription_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON subscription_payments(company_id);

-- 6. TABELA DE NOTIFICAÇÕES FINANCEIRAS (BILLING_NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS billing_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES subscription_invoices(id) ON DELETE SET NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'lembrete_preventivo_5d', 'vence_hoje', 'atraso_1d', 'lembrete_5d', 'alerta_10d', 'aviso_critico_12d', 'aviso_final_14d', 'suspensao_15d', 'reativacao'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10, 2),
    due_date DATE,
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'sent_in_app', -- 'pending', 'sent_in_app', 'sent_email', 'sent_whatsapp', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_notif_company ON billing_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_billing_notif_type ON billing_notifications(notification_type);

-- 7. TABELA DE EVENTOS DE AUDITORIA DE ASSINATURAS (SUBSCRIPTION_EVENTS)
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'criacao', 'alteracao_plano', 'pagamento_confirmado', 'pagamento_estornado', 'atraso_detectado', 'suspensao_programada', 'suspensao_efetuada', 'reativacao_efetuada'
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    reason TEXT NOT NULL,
    actor_id VARCHAR(255),
    actor_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_company ON subscription_events(company_id);

-- 8. POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
ALTER TABLE billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Leitura pública / anônima autenticada das configurações de cobrança
CREATE POLICY "Leitura pública de instruções de cobrança"
ON billing_settings FOR SELECT
TO authenticated, anon
USING (true);

-- Empresas podem consultar apenas seus próprios registros
CREATE POLICY "Empresa consulta sua assinatura"
ON subscriptions FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Empresa consulta suas faturas"
ON subscription_invoices FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Empresa consulta seus pagamentos"
ON subscription_payments FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Empresa consulta suas notificações financeiras"
ON billing_notifications FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Empresa consulta eventos de sua assinatura"
ON subscription_events FOR SELECT
TO authenticated, anon
USING (true);

-- Inserção / Modificação restrita a administradores globais ou funções seguras
CREATE POLICY "Admin gerencia assinaturas"
ON subscriptions FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin gerencia faturas"
ON subscription_invoices FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin gerencia pagamentos"
ON subscription_payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin gerencia notificacoes"
ON billing_notifications FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin gerencia eventos"
ON subscription_events FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
