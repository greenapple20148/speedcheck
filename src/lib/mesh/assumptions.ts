import type { Construction, WallMaterial, WifiBand } from "@/lib/mesh/types";

/**
 * Planning attenuations, not measurements from a home.
 * Typical midpoints sit inside ranges often used for indoor Wi-Fi planning
 * (drywall a few dB, masonry much more, concrete the highest). Real loss
 * depends on thickness, moisture, frequency, and what is inside the wall.
 */
export const MATERIAL_DB: Record<WallMaterial, { low: number; typical: number; high: number; label: string }> = {
  open: { low: 0, typical: 0, high: 0, label: "Open" },
  glass: { low: 1, typical: 3, high: 6, label: "Glass" },
  drywall: { low: 2, typical: 3, high: 5, label: "Drywall" },
  wood: { low: 2, typical: 4, high: 6, label: "Wood" },
  brick: { low: 6, typical: 10, high: 15, label: "Brick" },
  concrete: { low: 10, typical: 15, high: 20, label: "Concrete" },
};

/** Open-air score drop per foot. Higher bands fall off faster in this model. */
export const OPEN_LOSS_PER_FT: Record<WifiBand, number> = {
  "2.4": 0.45,
  "5": 0.7,
  "6": 0.9,
};

/** Planning area one node might cover before a floor penalty. Not a coverage guarantee. */
export const SQFT_PER_NODE: Record<Construction, number> = {
  wood: 1600,
  drywall: 1400,
  mixed: 1000,
  brick: 800,
  concrete: 550,
};

export const MATERIAL_FOR_CONSTRUCTION: Record<Construction, WallMaterial> = {
  wood: "wood",
  drywall: "drywall",
  mixed: "drywall",
  brick: "brick",
  concrete: "concrete",
};
