-- Optional account-owned history. The browser does not write these tables yet.
-- Explicit saves still use test_results via the service role in /api/results.
-- No IP address columns.

create table if not exists test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  test_type text not null,
  created_at timestamptz not null default now(),
  endpoint_id text,
  measurement_method text not null,
  summary jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1
);

create index if not exists test_sessions_user_created_idx
  on test_sessions (user_id, created_at desc);

create table if not exists test_measurements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references test_sessions (id) on delete cascade,
  metric_type text not null,
  metric_value double precision,
  unit text not null,
  measured_at timestamptz not null default now()
);

create table if not exists user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_units text not null default 'decimal',
  preferred_test_duration text not null default 'standard',
  save_history_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists saved_diagnostics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  test_session_id uuid references test_sessions (id) on delete set null,
  diagnosis jsonb not null,
  created_at timestamptz not null default now()
);

alter table test_sessions enable row level security;
alter table test_measurements enable row level security;
alter table user_preferences enable row level security;
alter table saved_diagnostics enable row level security;

create policy "own sessions select"
  on test_sessions for select
  using (auth.uid() is not null and user_id = auth.uid());

create policy "own sessions insert"
  on test_sessions for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "own sessions delete"
  on test_sessions for delete
  using (auth.uid() is not null and user_id = auth.uid());

create policy "own measurements select"
  on test_measurements for select
  using (
    exists (
      select 1 from test_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "own measurements insert"
  on test_measurements for insert
  with check (
    exists (
      select 1 from test_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "own preferences"
  on user_preferences for all
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "own diagnostics select"
  on saved_diagnostics for select
  using (auth.uid() is not null and user_id = auth.uid());

create policy "own diagnostics insert"
  on saved_diagnostics for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "own diagnostics delete"
  on saved_diagnostics for delete
  using (auth.uid() is not null and user_id = auth.uid());

-- Retention: delete from test_sessions where created_at < now() - interval '180 days';
