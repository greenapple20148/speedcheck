# SEO strategy

Each tool page sets a unique title, description, canonical URL, and an H1 through `buildMetadata` and `ToolShell`. The homepage title is separate from the `/speed-test` title so the two URLs are not identical.

Indexable URLs are listed in `src/app/sitemap.ts`. `/results/` stays disallowed in `robots.ts` except that `/history` is the public history URL. `/settings` is `noindex`.

Structured data:

- `WebApplication` on the homepage and tool shells, matching the visible tool.
- `FAQPage` only where the FAQ text is on the page.
- `Article` on guide pages, with `dateModified` set to the reviewed date.
- `BreadcrumbList` from the breadcrumb component.

No review stars, no aggregate ratings, and no claim that a game publisher or call vendor certified the result.

Copy stays specific to the measurement the page can actually run. Topics without a finished article stay in the backlog in `docs/implementation-plan.md` instead of becoming near-duplicate URLs.

Internal links run from the homepage cards, the footer, each tool’s related list, and the guide index.
