-- Multiplex IA — rastreabilidade por mensagem e isolamento multi-tenant

ALTER TABLE public.ai_routing_audit
  ADD COLUMN IF NOT EXISTS response_id TEXT,
  ADD COLUMN IF NOT EXISTS response_model TEXT,
  ADD COLUMN IF NOT EXISTS finish_reason TEXT,
  ADD COLUMN IF NOT EXISTS cached_input_tokens INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS request_metadata JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS response_hash TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_usage' AND column_name = 'date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_usage_daily_legacy'
  ) THEN
    ALTER TABLE public.ai_usage RENAME TO ai_usage_daily_legacy;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  input_tokens INT NOT NULL DEFAULT 0,
  cached_input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(12,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_usage_company_created
  ON public.ai_usage(company_id, created_at DESC);

DROP POLICY IF EXISTS ai_usage_company_read ON public.ai_usage;
CREATE POLICY ai_usage_company_read ON public.ai_usage
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = ai_usage.company_id
      AND cu.user_id = auth.uid()
      AND cu.active = TRUE
  ));

DROP POLICY IF EXISTS ai_routing_audit_company_read ON public.ai_routing_audit;
CREATE POLICY ai_routing_audit_company_read ON public.ai_routing_audit
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = ai_routing_audit.company_id
      AND cu.user_id = auth.uid()
      AND cu.active = TRUE
  ));

DROP POLICY IF EXISTS ai_routing_settings_company_read ON public.ai_routing_settings;
CREATE POLICY ai_routing_settings_company_read ON public.ai_routing_settings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = ai_routing_settings.company_id
      AND cu.user_id = auth.uid()
      AND cu.active = TRUE
  ));

GRANT SELECT ON public.conversations, public.messages TO authenticated;
GRANT ALL ON public.conversations, public.messages TO service_role;

DROP POLICY IF EXISTS conversations_company_read ON public.conversations;
CREATE POLICY conversations_company_read ON public.conversations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = conversations.company_id
      AND cu.user_id = auth.uid()
      AND cu.active = TRUE
  ));

DROP POLICY IF EXISTS messages_company_read ON public.messages;
CREATE POLICY messages_company_read ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = messages.company_id
      AND cu.user_id = auth.uid()
      AND cu.active = TRUE
  ));