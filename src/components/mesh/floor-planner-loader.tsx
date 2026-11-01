"use client";

import dynamic from "next/dynamic";

const FloorPlanner = dynamic(
  () => import("@/components/mesh/floor-planner").then((mod) => mod.FloorPlanner),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted-foreground">Loading the floor planner…</p>,
  },
);

export function FloorPlannerLoader() {
  return <FloorPlanner />;
}
