-- Multiplex — multi-provider (GPT / CLAUDE / DEEPSEEK)
-- Migração ADITIVA: nada é renomeado nem removido.

-- 1. Configurações da empresa: alias padrão, modo automático e política de revelar modelo
alter table public.ai_routing_settings add column if not exists default_model_alias text not null default 'gpt';
alter table public.ai_routing_settings add column if not exists auto_mode_enabled boolean not null default false;
alter table public.ai_routing_settings add column if not exists reveal_model boolean not null default false;

-- 2. Auditoria: provider, alias, tarefa e fallback real
alter table public.ai_routing_audit add column if not exists provider text;
alter table public.ai_routing_audit add column if not exists model_alias text;
alter table public.ai_routing_audit add column if not exists task_type text;
alter table public.ai_routing_audit add column if not exists routing_reason text;
alter table public.ai_routing_audit add column if not exists fallback_triggered boolean not null default false;
alter table public.ai_routing_audit add column if not exists fallback_from text;
alter table public.ai_routing_audit add column if not exists fallback_to text;
alter table public.ai_routing_audit add column if not exists fallback_reason text;
alter table public.ai_routing_audit add column if not exists auxiliary_models jsonb not null default '[]'::jsonb;

-- 3. Consumo por chamada
alter table public.ai_usage add column if not exists provider text;
alter table public.ai_usage add column if not exists model_alias text;
alter table public.ai_usage add column if not exists user_id uuid;
alter table public.ai_usage add column if not exists response_id text;
alter table public.ai_usage add column if not exists latency_ms integer;
alter table public.ai_usage add column if not exists task_type text;
alter table public.ai_usage add column if not exists routing_reason text;
alter table public.ai_usage add column if not exists fallback_triggered boolean not null default false;
alter table public.ai_usage add column if not exists fallback_from text;
alter table public.ai_usage add column if not exists fallback_to text;
alter table public.ai_usage add column if not exists fallback_reason text;

-- 4. Preferência individual (alias público apenas — nunca model ID)
create table if not exists public.user_ai_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  company_id uuid not null references public.companies(id) on delete cascade,
  primary_provider text not null,
  primary_model_alias text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, company_id)
);

grant select, insert, update, delete on public.user_ai_preferences to authenticated;
grant all on public.user_ai_preferences to service_role;
alter table public.user_ai_preferences enable row level security;

drop policy if exists "membros leem sua preferencia" on public.user_ai_preferences;
create policy "membros leem sua preferencia"
  on public.user_ai_preferences for select to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.company_users cu
      where cu.company_id = user_ai_preferences.company_id
        and cu.user_id = auth.uid()
        and cu.active
    )
  );

drop policy if exists "membros gravam sua preferencia" on public.user_ai_preferences;
create policy "membros gravam sua preferencia"
  on public.user_ai_preferences for all to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.company_users cu
      where cu.company_id = user_ai_preferences.company_id
        and cu.user_id = auth.uid()
        and cu.active
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.company_users cu
      where cu.company_id = user_ai_preferences.company_id
        and cu.user_id = auth.uid()
        and cu.active
    )
  );

-- 5. Processamento pesado assíncrono (modelos auxiliares)
create table if not exists public.ai_background_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  conversation_id uuid,
  task_type text not null,
  status text not null default 'pending',
  provider text,
  model text,
  input_reference jsonb not null default '{}'::jsonb,
  result_reference jsonb,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_background_jobs_company_idx
  on public.ai_background_jobs (company_id, created_at desc);

grant select on public.ai_background_jobs to authenticated;
grant all on public.ai_background_jobs to service_role;
alter table public.ai_background_jobs enable row level security;

drop policy if exists "membros leem jobs da empresa" on public.ai_background_jobs;
create policy "membros leem jobs da empresa"
  on public.ai_background_jobs for select to authenticated
  using (
    exists (
      select 1 from public.company_users cu
      where cu.company_id = ai_background_jobs.company_id
        and cu.user_id = auth.uid()
        and cu.active
    )
  );
