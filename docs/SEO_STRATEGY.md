# SEO Strategy

## Principles

- Answer genuine user questions with original content.
- Index only pages with distinctive, verified information.
- Prefer a small set of high-quality tool and guide pages over thin programmatic sprawl.
- Location and ISP pages are curated (hand-written summaries), not mass-generated shells.

## Indexable surfaces

| Path | Intent |
|------|--------|
| `/` | Primary conversion + brand |
| `/internet-speed-test` etc. | Tool intent |
| `/guides/*` | Informational |
| `/tools/mbps-to-mbs` | Utility |
| `/isp/[slug]` | ISP-qualified (curated only) |
| `/locations/[state]/[city]` | Local (curated only) |

## Non-indexable

- `/results/*` — private or share links; `noindex`
- `/admin/*` — internal
- `/api/*` — disallowed in robots.txt
- Incomplete placeholder pages — set `indexed: false` in content modules

## Technical

- Unique titles and meta descriptions via `buildMetadata`
- Canonical URLs from `NEXT_PUBLIC_SITE_URL`
- XML sitemap excludes non-indexable routes
- FAQ / Article / WebApplication JSON-LD where relevant
- Breadcrumbs on secondary pages
- Fonts with `display: swap`; reserved ad slots to reduce CLS

## Internal linking

Homepage → tools → guides → ISP/location pages → back to test CTA.
