import { BANDWIDTH_ACTIVITIES, estimateBandwidth } from "@/lib/calculators/bandwidth";

export interface ActivityLoad {
  id: string;
  label: string;
  downloadMbps: number;
  uploadMbps: number;
}

export const HOUSEHOLD_ACTIVITIES: ActivityLoad[] = BANDWIDTH_ACTIVITIES.map((activity) => ({
  id: activity.id,
  label: activity.name,
  downloadMbps: activity.downloadMbps,
  uploadMbps: activity.uploadMbps,
}));

export function householdDemand(counts: Record<string, number>): { downloadMbps: number; uploadMbps: number } {
  const estimate = estimateBandwidth(counts);
  return {
    downloadMbps: estimate.totalDownloadMbps,
    uploadMbps: estimate.totalUploadMbps,
  };
}
