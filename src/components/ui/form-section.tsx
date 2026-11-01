import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormSection({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "rounded-[20px] border border-[#E2E8E5] bg-white p-4 text-[#10231F] shadow-[0_1px_2px_rgba(16,35,31,0.04)] sm:p-5 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground",
        className,
      )}
    >
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
