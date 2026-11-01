import { summarizeRoom } from "@/lib/mesh/measurements";
import type { RoomMeasurement } from "@/lib/mesh/types";

export type MeshSymptom =
  | "slow-wifi"
  | "gaming"
  | "streaming"
  | "dead-zone"
  | "node-offline"
  | "disconnects"
  | "slow-upload"
  | "video"
  | "double-nat"
  | "distant-node"
  | "weak-upstairs"
  | "slow-backhaul"
  | "smart-home"
  | "below-plan"
  | "after-firmware";

export interface MeshRecommendation {
  id: string;
  cause: string;
  evidence: string;
  confidence: "low" | "medium" | "high";
  action: string;
  validate: string;
  guideHref: string;
}

const LABELS: Record<MeshSymptom, string> = {
  "slow-wifi": "Slow internet",
  gaming: "High gaming ping",
  streaming: "Streaming buffering",
  "dead-zone": "Wi-Fi dead zones",
  "node-offline": "Mesh node offline",
  disconnects: "Frequent disconnects",
  "slow-upload": "Slow upload",
  video: "Poor video calls",
  "double-nat": "Double NAT",
  "distant-node": "Device roaming problems",
  "weak-upstairs": "Weak coverage upstairs",
  "slow-backhaul": "The link between nodes is slow",
  "smart-home": "Smart-home devices drop",
  "below-plan": "Slower than the ISP plan",
  "after-firmware": "Problems after a firmware update",
};

export const MESH_SYMPTOMS = Object.keys(LABELS) as MeshSymptom[];

export function meshSymptomLabel(id: MeshSymptom): string {
  return LABELS[id];
}

export function troubleshootMesh(input: {
  symptoms: MeshSymptom[];
  nodeCount: number;
  floors: number;
  wired: boolean;
  measurements: RoomMeasurement[];
  rooms?: Array<{ id: string; name: string; floorName: string }>;
  brandName?: string | null;
  connection?: string | null;
  backhaul?: string | null;
  satelliteCount?: number;
}): MeshRecommendation[] {
  if (input.symptoms.length === 0) return [];
  const items: MeshRecommendation[] = [];
  const summaries = [...new Set(input.measurements.map((row) => row.roomId))].flatMap((roomId) => {
    const summary = summarizeRoom(input.measurements, roomId);
    if (!summary) return [];
    const room = input.rooms?.find((item) => item.id === roomId);
    return [{ ...summary, name: room ? `${room.floorName}: ${room.name}` : "Saved room" }];
  });
  const measured = summaries.filter((row) => row.downloadMbps != null);
  const slowRoom = measured.find((row) => (row.downloadMbps ?? 0) < 25);
  const satellites = input.satelliteCount ?? Math.max(0, input.nodeCount - 1);
  const evidence = measured.length
    ? `${measured.length} room${measured.length === 1 ? "" : "s"} with a saved median. A low speed is throughput to the test server, not a signal-strength reading.`
    : "No room test is saved yet, so this is a checklist rather than a diagnosis.";

  const add = (item: MeshRecommendation) => items.push(item);

  if (input.symptoms.includes("node-offline")) {
    add({
      id: "offline",
      cause: satellites < 1
        ? "The saved plan has no satellite node, so a mesh node cannot be confirmed offline from this page."
        : "The satellite may be too far from the next node, or it never finished pairing.",
      evidence: satellites < 1 ? "No satellite is saved in the floor plan. This browser cannot see node status." : evidence,
      confidence: satellites < 1 ? "low" : "medium",
      action: "Move the offline node halfway toward the primary node, power it on, and pair it again from the vendor app. Do not add a third node until this one stays online.",
      validate: "The vendor app should show the node online for several minutes. Then run a room test beside it.",
      guideHref: "/mesh-wifi/guides/where-to-place-mesh-nodes",
    });
  }
  if (input.symptoms.includes("weak-upstairs") || (input.floors > 1 && input.symptoms.includes("slow-wifi"))) {
    add({
      id: "upstairs",
      cause: "Floors and stairwells often block more than an open hallway on the same level.",
      evidence,
      confidence: input.floors > 1 ? "medium" : "low",
      action: "Place a node on the upper floor near the stair opening, not in a far bedroom, unless that bedroom is the only priority.",
      validate: "Run the room test upstairs and downstairs without moving anything else.",
      guideHref: "/mesh-wifi/guides/upstairs-mesh-coverage",
    });
  }
  if (input.symptoms.includes("slow-backhaul") || (!input.wired && input.nodeCount >= 2 && input.symptoms.includes("slow-wifi"))) {
    add({
      id: "backhaul",
      cause: "Wireless hops share airtime with your devices unless that model has a radio dedicated to the hop.",
      evidence: input.backhaul && input.backhaul !== "unknown" ? `Saved backhaul choice: ${input.backhaul}. ${evidence}` : evidence,
      confidence: input.wired ? "low" : "medium",
      action: input.wired
        ? "Confirm the cable is in a LAN port the model uses for backhaul, then retest."
        : "Shorten the distance between nodes or run Ethernet if a cable path already exists. Avoid powerline until you have compared it with a closer wireless placement.",
      validate: "Compare one room test with the satellite one room closer to the primary node.",
      guideHref: "/mesh-wifi/guides/ethernet-vs-wireless-backhaul",
    });
  }
  if (input.symptoms.includes("gaming")) {
    const high = summaries.find((row) => (row.pingMs ?? 0) > 50 || (row.jitterMs ?? 0) > 20);
    add({
      id: "gaming",
      cause: high ? "A saved room median shows high latency or jitter." : "Games react to delay and jitter.",
      evidence: high
        ? `${high.name} median latency ${formatOptional(high.pingMs, "ms")}, jitter ${formatOptional(high.jitterMs, "ms")}.`
        : evidence,
      confidence: high ? "medium" : "low",
      action: "Pause other downloads and repeat the test in the room where you play. This site cannot see the game server or the Wi-Fi node.",
      validate: "Compare the new result with this one on the before-and-after page.",
      guideHref: "/network-health/compare",
    });
  }
  if (input.symptoms.includes("streaming")) {
    const gap = roomGap(measured);
    add({
      id: "streaming",
      cause: gap ? "A saved room is much slower than another saved room." : "Buffering can come from the stream, the ISP, or the room.",
      evidence: gap ? `${gap.worst.name} median download ${formatMbps(gap.worst.downloadMbps)} against ${formatMbps(gap.best)} in the fastest saved room.` : evidence,
      confidence: gap ? "medium" : "low",
      action: "Play the stream in the slow room with other downloads paused. Do not buy hardware until a second room test shows the same gap.",
      validate: "Run the room test where the stream buffers, then compare it with a test beside the primary node.",
      guideHref: "/streaming-speed-test",
    });
  }
  if (input.symptoms.includes("dead-zone") || input.symptoms.includes("weak-upstairs")) {
    const gap = roomGap(measured);
    if (input.symptoms.includes("dead-zone")) {
      add({
        id: "dead-zone",
        cause: gap ? "One saved room’s median download is much lower than another." : "A slow room is not proof of a weak Wi-Fi signal.",
        evidence: gap ? `${gap.worst.name} median download ${formatMbps(gap.worst.downloadMbps)} against ${formatMbps(gap.best)} in the fastest saved room.` : evidence,
        confidence: gap ? "high" : "low",
        action: "Repeat the test in the slow room and in a room next to the primary node before moving a node.",
        validate: "Save both medians and compare them. The planner colors remain an estimate.",
        guideHref: "/mesh-wifi/dead-zone-test",
      });
    }
  }
  if (input.symptoms.includes("slow-upload")) {
    const low = summaries.find((row) => row.uploadMbps != null && row.uploadMbps < 5 && (row.downloadMbps ?? 0) >= 25);
    add({
      id: "slow-upload",
      cause: low ? "A saved room median shows low upload beside a faster download." : "Upload has not been measured low on a saved room test.",
      evidence: low
        ? `${low.name} median upload ${formatMbps(low.uploadMbps)} and download ${formatMbps(low.downloadMbps)}.`
        : evidence,
      confidence: low ? "medium" : "low",
      action: "Pause cloud backups and run the speed test again. Compare the upload with the rate on the ISP plan.",
      validate: "Save the new upload result and compare it with this one.",
      guideHref: "/slow-upload-speed",
    });
  }
  if (input.symptoms.includes("distant-node")) {
    add({
      id: "roaming",
      cause: satellites < 1 ? "Roaming between mesh nodes needs more than one node." : "A phone can stay attached to a farther node.",
      evidence: satellites < 1
        ? "The saved plan has no satellite. This browser cannot see which node a device joined."
        : `${satellites} satellite${satellites === 1 ? "" : "s"} in the saved plan. This browser cannot see which node a device joined.`,
      confidence: "low",
      action: "Check the connected node in the vendor app, then repeat the room test. Do not rely on this page for a node name.",
      validate: "If the vendor app shows a different node after you move, run the room test again.",
      guideHref: "/mesh-wifi/planner",
    });
  }
  if (input.symptoms.includes("slow-wifi") && input.connection && input.connection !== "unknown") {
    add({
      id: "connection-type",
      cause: "A Wi-Fi test does not show the speed at the ISP handoff.",
      evidence: `The saved plan says the connection is ${input.connection}. That value was typed here. It was not read from the router.`,
      confidence: "low",
      action: "Run one test with the computer plugged into the primary node or the ISP gateway, then compare it with the slow room.",
      validate: "Save both results and choose Wi-Fi vs Ethernet as the change.",
      guideHref: "/network-health/compare",
    });
  }
  if (input.symptoms.includes("double-nat")) {
    add({
      id: "nat",
      cause: "The ISP gateway and the mesh primary node may both be routing.",
      evidence: input.brandName
        ? `You selected double NAT. The saved plan names ${input.brandName}. This app cannot see the gateway mode.`
        : "You selected double NAT. This app cannot see the gateway mode.",
      confidence: "medium",
      action: "In the ISP gateway, enable bridge mode if the provider allows it, or set the mesh system to access-point mode. Change only one of those, then retest.",
      validate: "The vendor app or gateway page should show a single router. Online games and calls are the practical check.",
      guideHref: "/mesh-wifi/setup",
    });
  }
  if (input.symptoms.includes("after-firmware")) {
    add({
      id: "firmware",
      cause: "A recent update can change channels, steering, or a node that did not finish updating.",
      evidence,
      confidence: "low",
      action: "Confirm every node shows the same firmware in the vendor app. Reboot the primary node only after the update has finished.",
      validate: "Repeat the room test that failed. If it recovered, stop there.",
      guideHref: "/mesh-wifi/troubleshooter",
    });
  }
  if (input.symptoms.includes("video")) {
    const shaky = summaries.find((row) => (row.jitterMs ?? 0) > 20 || (row.pingMs ?? 0) > 50);
    add({
      id: "video",
      cause: shaky ? "A saved room median shows high jitter or latency." : "Video calls react to delay and jitter.",
      evidence: shaky
        ? `${shaky.name} median latency ${formatOptional(shaky.pingMs, "ms")}, jitter ${formatOptional(shaky.jitterMs, "ms")}.`
        : evidence,
      confidence: shaky ? "medium" : "low",
      action: "Pause other calls and downloads, then repeat the test in the room where the call fails.",
      validate: "Compare the follow-up with this result. This page cannot see the video service.",
      guideHref: "/video-call-test",
    });
  }
  if (input.symptoms.includes("disconnects")) {
    add({
      id: "disconnects",
      cause: "A browser speed test does not record Wi-Fi disconnects.",
      evidence: "No disconnect count is saved. This page cannot see association events from the router.",
      confidence: "low",
      action: "Note the time in the vendor app, then run a room test after the device reconnects.",
      validate: "If the room test fails only in one room, compare that room with a room beside the primary node.",
      guideHref: "/mesh-wifi/dead-zone-test",
    });
  }
  if (input.symptoms.includes("below-plan")) {
    add({
      id: "plan",
      cause: "A Wi-Fi test in a far room is often lower than the speed at the modem.",
      evidence,
      confidence: slowRoom ? "medium" : "low",
      action: "Run the speed test with a computer plugged into the primary node, or into the gateway if the mesh is in access-point mode. Compare that with the weak room.",
      validate: "If the wired test matches the plan and the far room does not, the gap is inside the home network.",
      guideHref: "/speed-test",
    });
  }
  if (items.length === 0) {
    add({
      id: "measure-first",
      cause: "The symptom needs a before-and-after test.",
      evidence,
      confidence: "low",
      action: "Pick one weak room, run the room test, move one node, and run the same test again. Free checks come before a new system.",
      validate: "Keep the room, the device, and the server the same so the two results can be compared.",
      guideHref: "/mesh-wifi/dead-zone-test",
    });
  }
  return items;
}

function roomGap(measured: Array<{ name: string; downloadMbps: number | null }>): { worst: { name: string; downloadMbps: number }; best: number } | null {
  const rows = measured.filter((row): row is { name: string; downloadMbps: number } => row.downloadMbps != null && row.downloadMbps > 0);
  if (rows.length < 2) return null;
  const best = Math.max(...rows.map((row) => row.downloadMbps));
  const worst = rows.reduce((slow, row) => (row.downloadMbps < slow.downloadMbps ? row : slow));
  if (best <= 0 || worst.downloadMbps / best >= 0.4) return null;
  return { worst, best };
}

function formatMbps(value: number | null): string {
  return value == null ? "—" : `${Math.round(value * 10) / 10} Mbps`;
}

function formatOptional(value: number | null, unit: string): string {
  return value == null ? "—" : `${Math.round(value)} ${unit}`;
}
