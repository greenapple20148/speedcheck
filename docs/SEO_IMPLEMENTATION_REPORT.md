# SEO Implementation Report

## Delivered

- Unique titles/descriptions via `buildMetadata`
- Canonical URLs from `NEXT_PUBLIC_SITE_URL`
- `sitemap.xml` includes only curated indexable routes
- `robots.txt` disallows `/api/`, `/admin/`, `/results/`
- Open Graph + Twitter cards
- FAQPage / WebApplication / Article JSON-LD
- Breadcrumbs on secondary pages
- Semantic headings and accessible FAQ accordion
- Fonts: Manrope + Inter with `display: swap`
- No mass-generated thin location pages (3 curated cities, 3 ISPs)

## Indexation policy

- Incomplete pages use `indexed: false` → `noindex`
- Result pages always `noindex`
- Admin always `noindex`

## Core Web Vitals posture

- Reserved ad placeholders to reduce CLS
- Ads/analytics scripts gated and lazy where applicable
- Measurement traffic bypasses Next.js (keeps LCP/TBT cleaner on Vercel)
- Hero is a single composition with brand-first hierarchy

## Manual CWV note

Lab Lighthouse not run in this environment (no Chrome UX report). Recommend PageSpeed Insights against staging after first deploy.
