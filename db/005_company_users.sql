-- Multiplex IA — vínculo entre usuário autenticado (Supabase Auth) e empresa.
-- Usado pela tela da empresa (/empresa): cada dono só vê e edita a sua empresa.

CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'owner',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_company_users_user ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON public.company_users(company_id);

GRANT SELECT ON public.company_users TO authenticated;
GRANT ALL ON public.company_users TO service_role;

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_users_self_read" ON public.company_users;
CREATE POLICY "company_users_self_read"
ON public.company_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
