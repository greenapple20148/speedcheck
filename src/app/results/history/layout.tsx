import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Speed Test History",
  description:
    "Track your past speed test results, compare trends to your internet plan, and filter by Wi‑Fi or wired connection.",
  path: "/results/history",
});

export default function ResultsHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
