-- Multiplex IA — auditoria de roteamento e prioridades por empresa
-- Rode este SQL no SQL Editor do Supabase (projeto mbjqzjipiuwtgmoxsqfu).

CREATE TABLE IF NOT EXISTS public.ai_routing_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'web',
    task_category VARCHAR(32) NOT NULL,
    complexity VARCHAR(16) NOT NULL,
    strategy VARCHAR(32) NOT NULL,
    model_selected VARCHAR(64) NOT NULL,
    model_used VARCHAR(64) NOT NULL,
    fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
    routing_signals JSONB DEFAULT '[]',
    user_message TEXT,
    assistant_message TEXT,
    tokens_prompt INT DEFAULT 0,
    tokens_completion INT DEFAULT 0,
    cost_usd NUMERIC(12,6),
    cost_status VARCHAR(32) DEFAULT 'preco_nao_configurado',
    latency_ms INT DEFAULT 0,
    tools_used JSONB DEFAULT '[]',
    context_sources JSONB DEFAULT '[]',
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT, INSERT ON public.ai_routing_audit TO authenticated;
GRANT ALL ON public.ai_routing_audit TO service_role;
ALTER TABLE public.ai_routing_audit ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_routing_audit_company
    ON public.ai_routing_audit(company_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_routing_settings (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    strategy VARCHAR(32) NOT NULL DEFAULT 'BALANCED',
    category_strategies JSONB NOT NULL DEFAULT '{}',
    model_prices JSONB NOT NULL DEFAULT '{}',
    monthly_budget_usd NUMERIC(12,2),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT ON public.ai_routing_settings TO authenticated;
GRANT ALL ON public.ai_routing_settings TO service_role;
ALTER TABLE public.ai_routing_settings ENABLE ROW LEVEL SECURITY;
