import { cn } from "@/lib/utils";
import { adsActive } from "@/lib/ads/config";

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
  if (!adsActive()) return null;

  return (
    <aside
      aria-label={label}
      className={cn("my-8 overflow-hidden", dims[format], className)}
      data-ad-slot={slot || "unassigned"}
      data-ad-enabled="true"
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
