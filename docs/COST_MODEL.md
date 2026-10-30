# Infrastructure Cost Model

Estimates assume moderate traffic. Actual costs vary by region and provider pricing.

## Bandwidth (dominant cost)

| Mode | Approx transfer / test | Notes |
|------|------------------------|-------|
| Lightweight | ≤ 20 MB | Good for mobile / low-cap plans |
| Standard | ≤ 80 MB | Better accuracy on fast links |

Examples at $0.01/GB egress (illustrative):

- 10,000 standard tests/day ≈ 800 GB/day ≈ $8/day ≈ $240/month
- With 50% lightweight mix ≈ ~$150/month

Server-side quotas (`SPEEDTEST_DAILY_BANDWIDTH_GB`, per-session budgets) are the primary cost control.

## Compute

| Component | Suggested size | Monthly (approx) |
|-----------|----------------|------------------|
| Measurement VPS | 2 vCPU / 2–4 GB | $12–40 |
| Vercel hobby/pro | Frontend hosting | $0–20 |
| Supabase | Free → Pro | $0–25 |

## Accuracy tradeoffs

Aggressive quotas shorten tests and can underestimate multi-gigabit links. Document expected variability of ±10–20% versus lab references under controlled conditions.

## Monetization offsets

- AdSense on guide/ISP pages (after approval)
- Affiliate ISP / mesh offers
- Future white-label B2B measurement
