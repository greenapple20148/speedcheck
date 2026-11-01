import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Speed Test History",
  description:
    "Saved speed tests now live on the history page.",
  path: "/results/history",
  index: false,
});

export default function ResultsHistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
