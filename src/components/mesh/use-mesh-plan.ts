"use client";

import { useCallback, useEffect, useState } from "react";
import { loadPlan, savePlan } from "@/lib/mesh/store";
import type { MeshPlan } from "@/lib/mesh/types";

export function useMeshPlan() {
  const [plan, setPlan] = useState<MeshPlan | null>(null);

  useEffect(() => {
    setPlan(loadPlan());
  }, []);

  const update = useCallback((next: MeshPlan) => {
    setPlan(next);
    savePlan(next);
  }, []);

  return { plan, update, ready: plan !== null };
}
