"use client";

import dynamic from "next/dynamic";

const FloorPlanner = dynamic(
  () => import("@/components/mesh/floor-planner").then((mod) => mod.FloorPlanner),
  {
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading the floor planner…</div>,
  },
);

export function FloorPlannerLoader() {
  return <FloorPlanner />;
}
