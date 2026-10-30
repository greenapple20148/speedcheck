import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Mbps to MB/s Converter",
  description:
    "Convert megabits per second (Mbps) to megabytes per second (MB/s) with a simple free calculator.",
  path: "/tools/mbps-to-mbs",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
