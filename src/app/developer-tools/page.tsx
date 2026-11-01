import type { Metadata } from "next";
import Link from "next/link";
import { DeveloperHub } from "@/components/dev-tools/developer-hub";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { DEVELOPER_TOOLS, HUB } from "@/lib/dev-tools/catalog";
import { faqPageJsonLd, webApplicationJsonLd } from "@/lib/seo/structured-data";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: HUB.metaTitle,
  description: HUB.description,
  path: "/developer-tools",
});

const BENEFITS = ["Free to use", "Runs in your browser", "Privacy-first", "No account required"];

export default function DeveloperToolsPage() {
  const structured = [
    webApplicationJsonLd({ name: HUB.h1, description: HUB.description, path: "/developer-tools" }),
    faqPageJsonLd(HUB.faqs),
  ].filter((item) => item != null);

  return (
    <div className="dev-tools">
      <JsonLd data={structured} />
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
        <Breadcrumbs items={[{ label: "Developer Tools" }]} currentPath="/developer-tools" />
        <header className="mb-8 grid items-center gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--dt-primary)]">Developer Tools</p>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-[var(--dt-text)] sm:text-5xl">
              {HUB.h1}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--dt-muted)]">{HUB.intro}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--dt-border)] bg-[var(--dt-card)] px-3 py-1.5 text-sm font-medium text-[var(--dt-text)]"
                >
                  <span className="h-2 w-2 rounded-full bg-[var(--dt-accent)]" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <LaptopArt />
        </header>
        <DeveloperHub
          tools={DEVELOPER_TOOLS.map((tool) => ({
            id: tool.id,
            name: tool.name,
            href: tool.href,
            description: tool.description,
            summary: tool.summary,
            category: tool.category,
          }))}
        />
        <section className="mt-10 max-w-3xl">
          <h2 className="font-heading text-xl font-semibold text-[var(--dt-text)]">How to use the hub</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--dt-muted)]">
            <li>Search by name, or choose JSON, Converters, Encoders, Security, or Text & Data.</li>
            <li>Open a tool. The search box stays on this page and does not create another URL.</li>
            <li>
              Start with the <Link className="font-medium text-[var(--dt-primary)] underline-offset-2 hover:underline" href="/developer-tools/json-formatter">JSON formatter</Link>, the{" "}
              <Link className="font-medium text-[var(--dt-primary)] underline-offset-2 hover:underline" href="/developer-tools/json-diff">diff checker</Link>, or{" "}
              <Link className="font-medium text-[var(--dt-primary)] underline-offset-2 hover:underline" href="/developer-tools/base64">Base64</Link>.
            </li>
          </ol>
        </section>
        <section className="mt-8 max-w-3xl">
          <h2 className="font-heading text-xl font-semibold text-[var(--dt-text)]">Common mistakes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--dt-muted)]">
            <li>Base64 hides nothing. It is not encryption.</li>
            <li>The JWT decoder does not verify a signature.</li>
            <li>Pasting a secret into a shared computer still leaves it in that browser tab until you leave the page.</li>
          </ul>
        </section>
        <div className="mt-10">
          <FaqSection items={HUB.faqs} />
        </div>
      </div>
    </div>
  );
}

function LaptopArt() {
  return (
    <svg viewBox="0 0 480 320" className="mx-auto h-auto w-full max-w-[460px]" aria-hidden="true">
      <rect x="48" y="28" width="384" height="230" rx="24" fill="#12352C" />
      <rect x="68" y="46" width="344" height="190" rx="12" fill="#0E2420" />
      <rect x="88" y="68" width="120" height="12" rx="6" fill="#5EEAD4" />
      <rect x="88" y="92" width="180" height="8" rx="4" fill="#9CA3AF" />
      <rect x="88" y="110" width="150" height="8" rx="4" fill="#6EE7B7" />
      <rect x="88" y="128" width="200" height="8" rx="4" fill="#9CA3AF" />
      <path d="M250 150h90v52h-90z" fill="#EAF8F1" opacity="0.15" />
      <path d="M268 186l18-28 14 16 10-12 22 24H268z" fill="#5EEAD4" />
      <path d="M24 258h432c8 18 8 28 0 36H24c-8-8-8-18 0-36z" fill="#D7E3DE" />
      <rect x="190" y="266" width="100" height="8" rx="4" fill="#94A3B8" />
    </svg>
  );
}
