import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getResult } from "@/lib/db/store";
import { buildMetadata } from "@/lib/seo/metadata";
import { ShareControls } from "@/components/speedtest/share-controls";
import { formatMbps, formatMs } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getResult(id);
  if (!result)
    return buildMetadata({
      title: "Result not found",
      description: "This speed test result could not be found.",
      path: `/results/${id}`,
      index: false,
    });
  return buildMetadata({
    title: result.isPublic
      ? `Speed test: ${formatMbps(result.downloadMbps)} Mbps down`
      : "Private speed test result",
    description: result.isPublic
      ? `Download ${formatMbps(result.downloadMbps)} Mbps · Upload ${formatMbps(result.uploadMbps)} Mbps · Ping ${formatMs(result.pingMs)} ms`
      : "This speed test result is private.",
    path: `/results/${id}`,
    index: false,
  });
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getResult(id);
  if (!result) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="heading-1 text-foreground">Speed test result</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {new Date(result.createdAt!).toLocaleString("en-US", { timeZone: "America/New_York" })} ET ·{" "}
        {result.mode} · {result.serverName}
        {!result.isPublic && " · Private"}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {[
          { label: "Download", value: `${formatMbps(result.downloadMbps)} Mbps` },
          { label: "Upload", value: `${formatMbps(result.uploadMbps)} Mbps` },
          { label: "Ping", value: `${formatMs(result.pingMs)} ms` },
          { label: "Jitter", value: `${formatMs(result.jitterMs)} ms` },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-1 font-heading text-2xl font-bold">{m.value}</div>
          </div>
        ))}
      </div>
      {result.isp && (
        <p className="mt-4 text-sm text-muted-foreground">ISP: {result.isp}</p>
      )}
      <ShareControls resultId={result.id} isPublic={result.isPublic} shareId={result.shareId} />
      <Link href="/#speed-test" className="mt-8 inline-block text-primary hover:underline">
        Run another test
      </Link>
    </div>
  );
}
