import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Speed Test History — Track & Compare Broadband Speeds",
  description:
    "View and analyze your saved internet speed tests. Compare Wi-Fi vs Ethernet performance, detect ISP throttling trends, and track ping and jitter history.",
  path: "/history",
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
