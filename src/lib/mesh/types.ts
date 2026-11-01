export const MESH_STORAGE_KEY = "myspeedgauge_mesh_plan_v1";
export const MESH_SCHEMA_VERSION = 1;

export type AreaUnit = "sqft" | "sqm";
export type Construction = "wood" | "drywall" | "brick" | "concrete" | "mixed";
export type WallMaterial = "open" | "drywall" | "wood" | "brick" | "concrete" | "glass";
export type WifiBand = "2.4" | "5" | "6";
export type BackhaulChoice = "unknown" | "ethernet" | "wireless-shared" | "wireless-dedicated" | "moca" | "powerline";

export interface MeshRoom {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  material: WallMaterial;
  priority: boolean;
  problem: boolean;
}

export interface MeshNode {
  id: string;
  name: string;
  x: number;
  y: number;
  role: "primary" | "satellite";
}

export interface MeshOutlet {
  id: string;
  x: number;
  y: number;
}

export interface RoomMeasurement {
  roomId: string;
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  testedAt: string;
  endpointName: string | null;
}

export interface MeshFloor {
  id: string;
  name: string;
  widthFt: number;
  heightFt: number;
  rooms: MeshRoom[];
  nodes: MeshNode[];
  outlets: MeshOutlet[];
}

export interface MeshHome {
  area: number;
  unit: AreaUnit;
  floors: number;
  construction: Construction;
  devices: number;
  ispMbps: number | null;
  connection: "cable" | "fiber" | "dsl" | "fixed-wireless" | "unknown";
  usage: Array<"browsing" | "streaming" | "calls" | "gaming" | "smart-home">;
  networkName: string;
  brandSlug: string;
  backhaul: BackhaulChoice;
  coax: boolean;
}

export interface MeshPlan {
  schemaVersion: number;
  updatedAt: string;
  wizardStep: number;
  home: MeshHome;
  floors: MeshFloor[];
  activeFloorId: string;
  measurements: RoomMeasurement[];
  checkedSetup: string[];
}

export type CoverageLevel = "strong" | "moderate" | "weak" | "dead";

export interface CoverageCell {
  x: number;
  y: number;
  level: CoverageLevel;
  score: number;
}
