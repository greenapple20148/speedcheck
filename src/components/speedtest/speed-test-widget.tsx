"use client";

import { SpeedTestDashboard } from "@/components/speedtest/dashboard/speed-test-dashboard";
import type { TestMode } from "@/types/speedtest";

interface SpeedTestWidgetProps {
  defaultMode?: TestMode;
  showModeToggle?: boolean;
}

/** @deprecated Use SpeedTestDashboard — kept for existing imports */
export function SpeedTestWidget(props: SpeedTestWidgetProps) {
  return <SpeedTestDashboard {...props} />;
}

export { SpeedTestDashboard };
