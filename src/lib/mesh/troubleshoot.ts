import type { RoomMeasurement } from "@/lib/mesh/types";

export type MeshSymptom =
  | "slow-wifi"
  | "node-offline"
  | "weak-upstairs"
  | "disconnects"
  | "distant-node"
  | "slow-backhaul"
  | "gaming"
  | "video"
  | "smart-home"
  | "below-plan"
  | "double-nat"
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
  "slow-wifi": "Slow Wi-Fi",
  "node-offline": "A node is offline",
  "weak-upstairs": "Weak coverage upstairs",
  disconnects: "Devices disconnect",
  "distant-node": "Devices stick to a far node",
  "slow-backhaul": "The link between nodes is slow",
  gaming: "Games feel laggy",
  video: "Video calls freeze",
  "smart-home": "Smart-home devices drop",
  "below-plan": "Slower than the ISP plan",
  "double-nat": "Double NAT",
  "after-firmware": "Problems after a firmware update",
};

export function meshSymptomLabel(id: MeshSymptom): string {
  return LABELS[id];
}

export function troubleshootMesh(input: {
  symptoms: MeshSymptom[];
  nodeCount: number;
  floors: number;
  wired: boolean;
  measurements: RoomMeasurement[];
}): MeshRecommendation[] {
  if (input.symptoms.length === 0) return [];
  const items: MeshRecommendation[] = [];
  const measured = input.measurements.filter((row) => row.downloadMbps != null);
  const slowRoom = measured.find((row) => (row.downloadMbps ?? 0) < 25);
  const evidence = measured.length
    ? `${measured.length} room test${measured.length === 1 ? "" : "s"} saved on this device. A low speed is throughput to the test server, not a signal-strength reading.`
    : "No room test is saved yet, so this is a checklist rather than a diagnosis.";

  const add = (item: MeshRecommendation) => items.push(item);

  if (input.symptoms.includes("node-offline")) {
    add({
      id: "offline",
      cause: "The satellite may be too far from the next node, or it never finished pairing.",
      evidence,
      confidence: "medium",
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
      evidence,
      confidence: input.wired ? "low" : "medium",
      action: input.wired
        ? "Confirm the cable is in a LAN port the model uses for backhaul, then retest."
        : "Shorten the distance between nodes or run Ethernet if a cable path already exists. Avoid powerline until you have compared it with a closer wireless placement.",
      validate: "Compare one room test with the satellite one room closer to the primary node.",
      guideHref: "/mesh-wifi/guides/ethernet-vs-wireless-backhaul",
    });
  }
  if (input.symptoms.includes("double-nat")) {
    add({
      id: "nat",
      cause: "The ISP gateway and the mesh primary node may both be routing.",
      evidence: "You selected double NAT. This app cannot see the gateway mode.",
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
