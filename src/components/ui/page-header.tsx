import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  align = "start",
  children,
}: {
  title: string;
  description?: string;
  align?: "start" | "center";
  children?: ReactNode;
}) {
  return (
    <header className={cn("mb-6 max-w-3xl", align === "center" && "mx-auto text-center")}>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-[2.125rem]">
        {title}
      </h1>
      {description ? <p className="mt-2 text-base leading-6 text-muted-foreground">{description}</p> : null}
      {children}
    </header>
  );
}
