-- Multiplex — 007
-- Migration ADITIVA: apenas GRANTs e policies de isolamento por empresa.
-- Não cria, renomeia nem remove tabela ou coluna. Nenhum dado é alterado.
-- As tabelas customers, orders e order_items JÁ EXISTEM neste banco e estão
-- com RLS habilitado sem nenhuma policy — o que bloqueia qualquer leitura
-- fora do service_role. Este arquivo adiciona o vínculo real via company_users.

begin;

-- Função de vínculo empresa <-> usuário autenticado (idempotente).
create or replace function public.is_company_member(_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_users cu
    where cu.company_id = _company_id
      and cu.active = true
      and (cu.user_id = auth.uid() or cu.email = auth.jwt() ->> 'email')
  )
$$;

do $$
declare
  t text;
begin
  foreach t in array array['customers', 'orders', 'order_items', 'products', 'product_categories', 'agents', 'companies', 'business_hours', 'knowledge_base', 'channels', 'payments']
  loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I enable row level security', t);
      execute format('grant select, insert, update, delete on public.%I to authenticated', t);
      execute format('grant all on public.%I to service_role', t);
    end if;
  end loop;
end
$$;

-- customers
drop policy if exists "company members manage customers" on public.customers;
create policy "company members manage customers" on public.customers
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- orders
drop policy if exists "company members manage orders" on public.orders;
create policy "company members manage orders" on public.orders
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- order_items
drop policy if exists "company members manage order items" on public.order_items;
create policy "company members manage order items" on public.order_items
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- payments
drop policy if exists "company members manage payments" on public.payments;
create policy "company members manage payments" on public.payments
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- products / product_categories
drop policy if exists "company members manage products" on public.products;
create policy "company members manage products" on public.products
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists "company members manage product categories" on public.product_categories;
create policy "company members manage product categories" on public.product_categories
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- agents / business_hours / knowledge_base / channels: leitura e escrita do próprio tenant
drop policy if exists "company members manage agents" on public.agents;
create policy "company members manage agents" on public.agents
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists "company members manage business hours" on public.business_hours;
create policy "company members manage business hours" on public.business_hours
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists "company members manage knowledge base" on public.knowledge_base;
create policy "company members manage knowledge base" on public.knowledge_base
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists "company members manage channels" on public.channels;
create policy "company members manage channels" on public.channels
  for all to authenticated
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- companies: o membro vê apenas a própria empresa
drop policy if exists "company members read own company" on public.companies;
create policy "company members read own company" on public.companies
  for select to authenticated
  using (public.is_company_member(id));

commit;
