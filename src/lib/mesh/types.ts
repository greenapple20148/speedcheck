export const MESH_STORAGE_KEY = "myspeedgauge_mesh_plan_v1";
export const MESH_SCHEMA_VERSION = 1;

export type AreaUnit = "sqft" | "sqm";
export type Construction = "wood" | "drywall" | "brick" | "concrete" | "mixed";
export type WallMaterial = "open" | "drywall" | "wood" | "brick" | "concrete" | "glass";
export type WifiBand = "2.4" | "5" | "6";
export type BackhaulChoice = "unknown" | "ethernet" | "wireless-shared" | "wireless-dedicated" | "moca" | "powerline";

export interface MeshPoint {
  x: number;
  y: number;
}

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
  /** When set, the room is a polygon. Older plans only have the rectangle. */
  points?: MeshPoint[];
}

export interface MeshNode {
  id: string;
  name: string;
  x: number;
  y: number;
  role: "primary" | "satellite";
  /** Planning band for this node. Omitted plans use the planner’s selected band. */
  band?: WifiBand;
  /** How this node links to the rest of the mesh. Omitted means wireless. */
  link?: "wired" | "wireless";
  /**
   * Explicit backhaul parent on this floor. Omitted plans connect each
   * satellite to the nearest node. This is not a signal reading.
   */
  parentId?: string;
}

export interface MeshWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  material: WallMaterial;
  /** A door or opening. Openings do not add wall loss. */
  opening: boolean;
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
  /** Present when the standard test recorded loaded latency. Older rows omit it. */
  loadedLatencyMs?: number | null;
  /** Present when the test recorded which measurement service ran. Older rows omit it. */
  provider?: "cloudflare" | "dedicated" | null;
}

/** How a local floor-plan image sits in the drawing, in feet. Omitted plans fill the floor. */
export interface MeshFloorImage {
  opacity?: number;
  /** Degrees clockwise. */
  rotation?: number;
  /** 1 draws the image across the full floor width. */
  scale?: number;
  offsetX?: number;
  offsetY?: number;
}

export interface MeshFloor {
  id: string;
  name: string;
  widthFt: number;
  heightFt: number;
  rooms: MeshRoom[];
  nodes: MeshNode[];
  outlets: MeshOutlet[];
  walls?: MeshWall[];
  /** Local preview only. Never uploaded. */
  imageDataUrl?: string | null;
  /** Optional placement for imageDataUrl. Older plans omit it and still fill the floor. */
  image?: MeshFloorImage;
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
  /** False when the cell sits outside drawn rooms. Older callers can ignore it. */
  inside?: boolean;
}
