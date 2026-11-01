-- Optional cloud copy of a mesh plan. The browser does not write this table.
-- Anonymous plans stay in localStorage. Wire an insert only after the visitor
-- signs in and explicitly asks to sync. Do not store Wi-Fi passwords.

create table if not exists public.mesh_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Home',
  plan jsonb not null,
  updated_at timestamptz not null default now(),
  constraint mesh_plans_plan_size check (octet_length(plan::text) < 200000)
);

alter table public.mesh_plans enable row level security;

create policy "mesh_plans_select_own"
  on public.mesh_plans for select
  using (auth.uid() = user_id);

create policy "mesh_plans_insert_own"
  on public.mesh_plans for insert
  with check (auth.uid() = user_id);

create policy "mesh_plans_update_own"
  on public.mesh_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "mesh_plans_delete_own"
  on public.mesh_plans for delete
  using (auth.uid() = user_id);
