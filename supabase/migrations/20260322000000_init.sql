-- SpeedCheck initial schema
-- Privacy: no raw IP columns by default

create extension if not exists "pgcrypto";

create table if not exists test_servers (
  id text primary key,
  name text not null,
  region text not null,
  location text not null,
  url text not null,
  healthy boolean not null default true,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists test_results (
  id text primary key,
  share_id text unique,
  download_mbps numeric(12,3) not null,
  upload_mbps numeric(12,3) not null,
  ping_ms numeric(12,3) not null,
  jitter_ms numeric(12,3) not null,
  mode text not null check (mode in ('lightweight', 'standard')),
  server_id text references test_servers(id),
  server_name text not null,
  isp text,
  city text,
  country text,
  is_public boolean not null default false,
  user_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists test_results_created_at_idx on test_results (created_at desc);
create index if not exists test_results_public_idx on test_results (is_public) where is_public = true;
create index if not exists test_results_server_idx on test_results (server_id, created_at desc);

create table if not exists bandwidth_usage_daily (
  day date not null,
  server_id text not null references test_servers(id),
  bytes_transferred bigint not null default 0,
  tests_started integer not null default 0,
  tests_completed integer not null default 0,
  tests_rejected integer not null default 0,
  primary key (day, server_id)
);

create table if not exists aggregated_speed_statistics (
  id bigserial primary key,
  period_start date not null,
  period_end date not null,
  region text,
  isp text,
  sample_count integer not null,
  download_p50 numeric(12,3),
  download_p90 numeric(12,3),
  upload_p50 numeric(12,3),
  ping_p50 numeric(12,3),
  created_at timestamptz not null default now(),
  check (sample_count >= 30)
);

create table if not exists seo_pages (
  path text primary key,
  title text not null,
  description text not null,
  indexed boolean not null default false,
  content_hash text,
  updated_at timestamptz not null default now()
);

create table if not exists affiliate_offers (
  id text primary key,
  provider text not null,
  title text not null,
  description text not null,
  url text not null,
  cta text not null,
  regions text[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id bigserial primary key,
  name text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on analytics_events (name, created_at desc);

-- Retention helper: mark private results for deletion after 90 days
-- (run via scheduled job)
-- delete from test_results where is_public = false and created_at < now() - interval '90 days';

alter table test_results enable row level security;
alter table aggregated_speed_statistics enable row level security;
alter table affiliate_offers enable row level security;

-- Public can read public results by share_id via service role in API;
-- anon policies remain locked down by default.
create policy "public read public aggregates"
  on aggregated_speed_statistics for select
  using (sample_count >= 30);

create policy "public read active offers"
  on affiliate_offers for select
  using (active = true);
