import { CALL_REFERENCE_MBPS, STREAMING_REFERENCE_MBPS } from "@/lib/calculators/units";

export interface ActivityLoad {
  id: string;
  label: string;
  downloadMbps: number;
  uploadMbps: number;
}

export const HOUSEHOLD_ACTIVITIES: ActivityLoad[] = [
  { id: "browse", label: "Web browsing", downloadMbps: 3, uploadMbps: 1 },
  { id: "hd", label: "HD stream", downloadMbps: STREAMING_REFERENCE_MBPS.hd, uploadMbps: 0.5 },
  { id: "uhd", label: "4K stream", downloadMbps: STREAMING_REFERENCE_MBPS.uhd4k, uploadMbps: 1 },
  { id: "call", label: "Video call", downloadMbps: CALL_REFERENCE_MBPS.zoom.down, uploadMbps: CALL_REFERENCE_MBPS.zoom.up },
  { id: "backup", label: "Cloud backup", downloadMbps: 1, uploadMbps: 10 },
];

export function householdDemand(
  counts: Record<string, number>,
): { downloadMbps: number; uploadMbps: number } {
  let downloadMbps = 0;
  let uploadMbps = 0;
  for (const activity of HOUSEHOLD_ACTIVITIES) {
    const count = counts[activity.id] ?? 0;
    if (!Number.isFinite(count) || count <= 0) continue;
    downloadMbps += activity.downloadMbps * count;
    uploadMbps += activity.uploadMbps * count;
  }
  return { downloadMbps, uploadMbps };
}
