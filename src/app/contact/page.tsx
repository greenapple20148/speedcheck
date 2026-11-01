import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: "How to reach MySpeedGauge. A contact inbox is shown only when one is configured.",
  path: "/contact",
});

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
      {email ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Email{" "}
          <a className="font-medium text-primary hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
          .
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          A public contact address is not configured for this deployment. Questions about a result are better answered by repeating the test and reading the methodology than by a form that cannot be delivered.
        </p>
      )}
      <p className="mt-3 text-sm">
        <Link href="/internet-troubleshooter" className="font-medium text-primary hover:underline">
          Use the troubleshooter
        </Link>
      </p>
    </article>
  );
}
