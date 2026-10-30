-- Aggregate privacy-safe speed statistics.
-- Only emits rows when sample_count >= 30 (enforced by table check constraint).

insert into aggregated_speed_statistics (
  period_start,
  period_end,
  region,
  isp,
  sample_count,
  download_p50,
  download_p90,
  upload_p50,
  ping_p50
)
select
  date_trunc('week', created_at)::date as period_start,
  (date_trunc('week', created_at) + interval '6 days')::date as period_end,
  nullif(country, '') as region,
  nullif(isp, '') as isp,
  count(*)::int as sample_count,
  percentile_cont(0.5) within group (order by download_mbps) as download_p50,
  percentile_cont(0.9) within group (order by download_mbps) as download_p90,
  percentile_cont(0.5) within group (order by upload_mbps) as upload_p50,
  percentile_cont(0.5) within group (order by ping_ms) as ping_p50
from test_results
where created_at >= now() - interval '14 days'
  and download_mbps > 0
  and upload_mbps >= 0
group by 1, 2, 3, 4
having count(*) >= 30;
