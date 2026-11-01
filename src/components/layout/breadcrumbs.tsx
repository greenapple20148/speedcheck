import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbListJsonLd } from "@/lib/seo/structured-data";
import { cn } from "@/lib/utils";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({
  items,
  className,
  currentPath,
}: {
  items: Crumb[];
  className?: string;
  currentPath?: string;
}) {
  const schemaItems = items.map((item, index) =>
    index === items.length - 1 && !item.href && currentPath ? { ...item, href: currentPath } : item,
  );
  return (
    <>
      <JsonLd data={breadcrumbListJsonLd(schemaItems)} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
      <ol className={cn("flex flex-wrap items-center gap-1", className)}>
        <li>
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
    </>
  );
}
