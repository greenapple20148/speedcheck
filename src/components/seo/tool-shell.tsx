import Link from "next/link";
import { Breadcrumbs, type Crumb } from "@/components/layout/breadcrumbs";
import { FaqSection, type FaqItem } from "@/components/seo/faq-section";
import { JsonLd } from "@/components/seo/json-ld";
import { articleJsonLd, faqPageJsonLd, webApplicationJsonLd } from "@/lib/seo/structured-data";

interface ToolShellProps {
  title: string;
  description: string;
  path: string;
  intro: string;
  methodology?: string;
  faqs?: FaqItem[];
  related?: Array<{ href: string; label: string }>;
  crumbs?: Crumb[];
  schema?: "application" | "article";
  dateModified?: string;
  /** Hide the centered title block when the page renders its own H1. */
  hideHeader?: boolean;
  /** Use the wider dashboard width. Other tools stay at max-w-6xl. */
  wide?: boolean;
  methodologyHeading?: string;
  children: React.ReactNode;
}

export function ToolShell({
  title,
  description,
  path,
  intro,
  methodology,
  faqs = [],
  related = [],
  crumbs,
  schema = "application",
  dateModified,
  hideHeader = false,
  wide = false,
  methodologyHeading = "How this measurement works",
  children,
}: ToolShellProps) {
  const trail = crumbs ?? [{ label: title }];
  const structured: Record<string, unknown>[] = [
    schema === "article"
      ? articleJsonLd({ headline: title, description, path, dateModified })
      : webApplicationJsonLd({ name: title, description, path }),
  ];
  const faqLd = faqPageJsonLd(faqs);
  if (faqLd) structured.push(faqLd);

  return (
    <div className={`mx-auto px-4 py-6 sm:py-8 ${wide ? "max-w-[1440px]" : "max-w-6xl"}`}>
      <JsonLd data={structured} />
      <Breadcrumbs items={trail} currentPath={path} className="justify-center" />
      {!hideHeader && (
        <header className="mx-auto mb-4 max-w-3xl text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-2 text-muted-foreground">{intro}</p>
        </header>
      )}
      {children}
      {methodology && (
        <section className="mt-10 max-w-3xl" aria-labelledby="method-heading">
          <h2 id="method-heading" className="text-lg font-semibold text-foreground">
            {methodologyHeading}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{methodology}</p>
        </section>
      )}
      {faqs.length > 0 && (
        <div className="mt-10">
          <FaqSection items={faqs} />
        </div>
      )}
      {related.length > 0 && (
        <nav className="mt-10" aria-label="Related pages">
          <h2 className="text-lg font-semibold text-foreground">Related</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {related.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm font-medium text-primary hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
