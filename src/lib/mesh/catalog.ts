export interface MeshBrand {
  slug: string;
  name: string;
  supportUrl: string;
  reviewed: string;
  summary: string;
  appName: string;
}

export const MESH_BRANDS: MeshBrand[] = [
  {
    slug: "eero",
    name: "Amazon eero",
    supportUrl: "https://support.eero.com/",
    reviewed: "2026-11-01",
    appName: "eero app",
    summary: "eero, eero Pro, eero 6, and eero 7 do not share one setup screen. Use the guide for the model printed on the node.",
  },
  {
    slug: "google-nest",
    name: "Google Nest Wifi",
    supportUrl: "https://support.google.com/googlenest/",
    reviewed: "2026-11-01",
    appName: "Google Home app",
    summary: "Nest Wifi and Nest Wifi Pro are different products. Follow the Google Home flow for the unit you unboxed.",
  },
  {
    slug: "tp-link-deco",
    name: "TP-Link Deco",
    supportUrl: "https://www.tp-link.com/support/",
    reviewed: "2026-11-01",
    appName: "Deco app",
    summary: "Deco model numbers change ports, bands, and backhaul. Match the steps to the model on the bottom label.",
  },
  {
    slug: "netgear-orbi",
    name: "NETGEAR Orbi",
    supportUrl: "https://kb.netgear.com/",
    reviewed: "2026-11-01",
    appName: "Orbi app",
    summary: "Orbi router and satellite units are not interchangeable on every kit. The router unit is the one that connects to the modem.",
  },
  {
    slug: "asus-zenwifi",
    name: "ASUS ZenWiFi",
    supportUrl: "https://www.asus.com/support/",
    reviewed: "2026-11-01",
    appName: "ASUS Router app",
    summary: "AiMesh and ZenWiFi kits differ. Use the QSG for that exact model before you mix nodes from another ASUS line.",
  },
  {
    slug: "linksys-velop",
    name: "Linksys Velop",
    supportUrl: "https://support.linksys.com/",
    reviewed: "2026-11-01",
    appName: "Linksys app",
    summary: "Velop nodes from different generations are not always compatible. Check the support article for the model on the node.",
  },
  {
    slug: "generic",
    name: "Other mesh system",
    supportUrl: "",
    reviewed: "2026-11-01",
    appName: "the vendor app",
    summary: "Use the printed quick start for your model. The checklist below is the shared part of a mesh install, not a substitute for that guide.",
  },
];

export function getMeshBrand(slug: string): MeshBrand | undefined {
  return MESH_BRANDS.find((brand) => brand.slug === slug);
}

export interface MeshGuide {
  slug: string;
  title: string;
  description: string;
  reviewed: string;
  toolHref: string;
  toolLabel: string;
  faqs: Array<{ question: string; answer: string }>;
  sections: Array<{ heading: string; body: string }>;
}

export const MESH_GUIDES: MeshGuide[] = [
  {
    slug: "how-many-mesh-nodes",
    title: "How many mesh nodes do I need?",
    description: "A starting mesh node count from home size, floors, and construction, and why extra nodes can make Wi-Fi worse.",
    reviewed: "2026-11-01",
    toolHref: "/mesh-wifi/node-calculator",
    toolLabel: "Open the node calculator",
    faqs: [
      {
        question: "Does every floor need its own mesh node?",
        answer: "A second floor usually needs a node near the stairs, not one in every bedroom. Test the far room before you add another.",
      },
      {
        question: "Will more nodes always make Wi-Fi faster?",
        answer: "No. Extra wireless nodes share airtime unless the model has a radio set aside for the hop. Two well-placed nodes often beat four nodes in the same rooms.",
      },
    ],
    sections: [
      {
        heading: "Start from the floor plan, not a package photo",
        body: "Vendors print a square-foot number that assumes an open house. Brick, concrete, and a second floor shrink the useful area. The calculator on this site uses a conservative planning area and tells you when a single router may be enough.",
      },
      {
        heading: "More nodes are not automatically faster",
        body: "Each wireless hop uses airtime unless that model has a radio set aside for the link between nodes. Two well-placed nodes often beat four nodes stacked in the same rooms. Add a node only after a room test shows a specific room is slow.",
      },
      {
        heading: "Check the wired speed first",
        body: "If a computer plugged into the primary node is already slower than the plan, another satellite will not fix the ISP or the gateway. Run that test before you buy anything.",
      },
    ],
  },
  {
    slug: "where-to-place-mesh-nodes",
    title: "Best placement for mesh nodes",
    description: "Where to put mesh satellites so they can hear the next node, including upstairs and at the end of a hallway.",
    reviewed: "2026-11-01",
    toolHref: "/mesh-wifi/planner",
    toolLabel: "Open the floor planner",
    faqs: [
      {
        question: "Should a mesh satellite go in the room with the worst signal?",
        answer: "Only if that satellite can still hear another node. A spot halfway along the hallway, or near the stairs, is often a better first try than the farthest corner.",
      },
      {
        question: "Where should a mesh node sit in the room?",
        answer: "On a shelf at about table height, in the open. Cabinets, TV niches, and the floor behind a sofa add loss the planner cannot see.",
      },
    ],
    sections: [
      {
        heading: "The hop matters as much as the room",
        body: "A satellite in a far bedroom helps that bedroom only if it still has a solid link to another node. Halfway along a hallway, or near the stairs to the next floor, is often a better first try than the farthest corner.",
      },
      {
        heading: "Keep nodes in the open",
        body: "Cabinets, TV niches, and the floor behind a sofa add loss the planning map cannot see. Set the node on a shelf at about table height, away from a microwave, a cordless-phone base, and a thick stone fireplace.",
      },
      {
        heading: "Mark the room, then measure it",
        body: "The planner’s colors are an estimate. After you place a node, run the room test in the priority room and again after you move that one node.",
      },
    ],
  },
  {
    slug: "ethernet-vs-wireless-backhaul",
    title: "Ethernet backhaul vs wireless backhaul",
    description: "When a cable between mesh nodes helps, and when a model cannot use one.",
    reviewed: "2026-11-01",
    toolHref: "/mesh-wifi/backhaul-advisor",
    toolLabel: "Open the backhaul advisor",
    faqs: [
      {
        question: "Is Ethernet backhaul always better than wireless?",
        answer: "A cable keeps the hop between nodes off the air when that model can use a LAN port for backhaul. Some kits cannot. Check the guide for the model on the label.",
      },
      {
        question: "Should I use powerline for mesh backhaul?",
        answer: "Powerline varies with the electrical circuit. Compare a closer wireless placement first, and use existing coax with MoCA only when the model supports that path.",
      },
    ],
    sections: [
      {
        heading: "Ethernet keeps the hop off the air",
        body: "If a cable already joins two rooms, use it between the primary node and a satellite when that model’s guide says a LAN port can be backhaul. Phones and laptops then share the radio with each other, not with the link between nodes.",
      },
      {
        heading: "Wireless backhaul is normal, and it has a cost",
        body: "Many kits ship with no requirement for a cable. On a dual-band system the same radios carry both your traffic and the hop. A tri-band or Wi-Fi 7 system might dedicate a band, but only that model’s spec sheet can say so.",
      },
      {
        heading: "Powerline and coax are different tools",
        body: "MoCA over existing coax can be a wired hop. Powerline adapters vary with the electrical circuit and are worth trying only after a closer wireless placement has been measured.",
      },
    ],
  },
  {
    slug: "mesh-vs-extender",
    title: "Mesh router vs extender",
    description: "An extender repeats one network name poorly. A mesh system is built to steer devices, and it can still be placed badly.",
    reviewed: "2026-11-01",
    toolHref: "/mesh-wifi",
    toolLabel: "Plan a mesh layout",
    faqs: [
      {
        question: "Is a mesh system the same as a Wi-Fi extender?",
        answer: "An extender usually repeats one radio and may create a second network name. A mesh kit is built as one network. It can still be placed badly.",
      },
      {
        question: "Should I replace an extender with mesh right away?",
        answer: "If you already own a mesh kit, move one node and retest the weak room. A different brand is the step after the wired speed is fine and a better placement still fails.",
      },
    ],
    sections: [
      {
        heading: "What an extender usually does",
        body: "A classic extender listens on a channel and repeats it. Devices may cling to the extender or to the router. You often get a second network name and a slower hop.",
      },
      {
        heading: "What mesh adds",
        body: "Mesh kits are designed as one network, with nodes that know about each other. That does not guarantee a device will roam at the right doorway, and it does not remove walls.",
      },
      {
        heading: "Try placement before a new box",
        body: "If you already own a mesh kit, move one node and retest the weak room. Buying a different brand is the step after the wired speed is fine and a better placement still fails.",
      },
    ],
  },
  {
    slug: "upstairs-mesh-coverage",
    title: "Mesh Wi-Fi upstairs not working",
    description: "Why a mesh node upstairs can be slow, and where to place it so the floor does not block the hop.",
    reviewed: "2026-11-01",
    toolHref: "/mesh-wifi/dead-zone-test",
    toolLabel: "Test rooms upstairs and down",
    faqs: [
      {
        question: "Why is mesh Wi-Fi slow upstairs?",
        answer: "A floor blocks more than an open hallway. A node at the top of the stairs often hears the downstairs node better than a node in a closed bedroom.",
      },
      {
        question: "Does a slow upstairs speed test mean the signal is weak?",
        answer: "Not by itself. Compare it with a test beside the primary node. The room test measures throughput to the server, not signal strength or which node the phone joined.",
      },
    ],
    sections: [
      {
        heading: "Stairs are usually the opening",
        body: "A node at the top of the stairs, or on the landing, often hears the downstairs node better than a node in a closed bedroom at the end of the hall.",
      },
      {
        heading: "Do not judge the floor by one speed number",
        body: "A slow upstairs test can be a busy link, a distant node, or the ISP. Compare it with a test beside the primary node. This site cannot see which node your phone is attached to.",
      },
      {
        heading: "One change at a time",
        body: "Move the upstairs node, wait a minute, and run the same room test. If it improves, leave the other nodes where they are.",
      },
    ],
  },
];

export function getMeshGuide(slug: string): MeshGuide | undefined {
  return MESH_GUIDES.find((guide) => guide.slug === slug);
}

export const MESH_SITEMAP_PATHS = [
  "/mesh-wifi",
  "/mesh-wifi/setup",
  "/mesh-wifi/planner",
  "/mesh-wifi/node-calculator",
  "/mesh-wifi/placement-optimizer",
  "/mesh-wifi/dead-zone-test",
  "/mesh-wifi/backhaul-advisor",
  "/mesh-wifi/troubleshooter",
  "/mesh-wifi/wifi-6-vs-wifi-7",
  "/mesh-wifi/brands",
  ...MESH_BRANDS.filter((brand) => brand.slug !== "generic").map((brand) => `/mesh-wifi/brands/${brand.slug}`),
  ...MESH_GUIDES.map((guide) => `/mesh-wifi/guides/${guide.slug}`),
];
