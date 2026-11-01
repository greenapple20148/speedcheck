import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Speed Test History",
  description: "Tests you saved in this browser. Delete any result from this page.",
  path: "/history",
});

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
