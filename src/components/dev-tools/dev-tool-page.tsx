import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FaqSection } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { RelatedActions } from "@/components/ui/related-actions";
import { getTool, type DevTool } from "@/lib/dev-tools/catalog";
import { faqPageJsonLd, webApplicationJsonLd } from "@/lib/seo/structured-data";

export function DevToolPage({ tool, children }: { tool: DevTool; children: ReactNode }) {
  const structured: Record<string, unknown>[] = [
    webApplicationJsonLd({ name: tool.h1, description: tool.description, path: tool.href }),
  ];
  const faq = faqPageJsonLd(tool.faqs);
  if (faq) structured.push(faq);
  const related = tool.related.flatMap((id) => {
    const item = getTool(id);
    return [{ href: item.href, label: item.name }];
  });

  return (
    <div className="dev-tools">
      <JsonLd data={structured} />
      <article className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:py-10">
        <Breadcrumbs
          items={[
            { href: "/developer-tools", label: "Developer Tools" },
            { label: tool.name },
          ]}
          currentPath={tool.href}
        />
        <header className="mb-5 max-w-3xl">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-[var(--dt-text)] sm:text-4xl">{tool.h1}</h1>
          <p className="mt-2 text-base leading-6 text-[var(--dt-muted)]">{tool.intro}</p>
        </header>
        {children}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="font-heading text-xl font-semibold text-[var(--dt-text)]">How to use it</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[var(--dt-muted)]">
              {tool.howTo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          <section>
            <h2 className="font-heading text-xl font-semibold text-[var(--dt-text)]">Common mistakes</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--dt-muted)]">
              {tool.mistakes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
        <section className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-[var(--dt-text)]">Examples</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {tool.examples.map((example) => (
              <div key={example.title} className="min-w-0 rounded-2xl border border-[var(--dt-border)] bg-[var(--dt-card)] p-4">
                <h3 className="font-heading text-base font-semibold text-[var(--dt-text)]">{example.title}</h3>
                <pre className="dt-mono mt-2 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-[var(--dt-text)]">{example.body}</pre>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-10">
          <FaqSection items={tool.faqs} />
        </div>
        <RelatedActions items={related} heading="Related tools" />
        <p className="mt-6 max-w-3xl text-sm leading-6 text-[var(--dt-muted)]">{tool.privacy}</p>
      </article>
    </div>
  );
}
