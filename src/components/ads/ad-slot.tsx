import { cn } from "@/lib/utils";

interface AdSlotProps {
  slot?: string;
  format?: "horizontal" | "rectangle" | "vertical";
  className?: string;
  label?: string;
}

const dims = {
  horizontal: "min-h-[90px]",
  rectangle: "min-h-[250px]",
  vertical: "min-h-[600px]",
};

export function AdSlot({
  slot,
  format = "horizontal",
  className,
  label = "Advertisement",
}: AdSlotProps) {
  const enabled =
    process.env.NEXT_PUBLIC_ENABLE_ADS === "true" &&
    Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

  // Always reserve space to avoid CLS when ads are enabled later
  return (
    <aside
      aria-label={label}
      className={cn(
        "my-8 overflow-hidden rounded-xl border border-dashed border-border bg-muted/30",
        dims[format],
        className,
      )}
      data-ad-slot={slot || "unassigned"}
      data-ad-enabled={enabled ? "true" : "false"}
    >
      <div className="flex h-full min-h-[inherit] flex-col items-center justify-center gap-1 px-4 py-6 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {!enabled && (
          <p className="max-w-sm text-xs text-muted-foreground">
            Ad placeholder — enable with NEXT_PUBLIC_ENABLE_ADS and AdSense client ID.
          </p>
        )}
        {enabled && (
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%" }}
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        )}
      </div>
    </aside>
  );
}
