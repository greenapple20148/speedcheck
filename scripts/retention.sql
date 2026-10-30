-- SpeedCheck result retention policy
-- Schedule daily via Supabase cron / pg_cron / external job runner.

-- Private results older than 90 days
delete from test_results
where is_public = false
  and created_at < now() - interval '90 days';

-- Public shared results older than 365 days (optional; keep longer for SEO shares)
delete from test_results
where is_public = true
  and created_at < now() - interval '365 days';

-- Trim analytics events older than 180 days
delete from analytics_events
where created_at < now() - interval '180 days';
