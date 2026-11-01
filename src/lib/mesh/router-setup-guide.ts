/**
 * Setup notes for the public wizard.
 * These point at the vendor’s own guide. They do not describe a live session
 * with the router, and they do not include a password field.
 */

export interface RouterSetupNotes {
  mode: string;
  doubleNat: string;
  backhaul: string;
  pairing: string;
  firmware: string;
  guest: string;
}

const SHARED_DOUBLE_NAT = "If the ISP gateway and this system both hand out addresses, devices sit behind two routers. Bridge the ISP gateway or put this system in access-point mode. Change one of those, using the model guide, and leave the other as it is.";
const SHARED_FIRMWARE = "Let the vendor app finish its firmware update on every node before you judge speed. This site cannot see the installed firmware version.";
const SHARED_GUEST = "Add a guest network only after the main network is up. Create it in the vendor app. Do not type the guest password into this site.";
const SHARED_PAIRING = "Pair one satellite at a time, close to the primary node, then move it. If the app shows a different order, follow the quick start for the model on the label.";

const NOTES: Record<string, RouterSetupNotes> = {
  eero: {
    mode: "eero is managed in the eero app. Some kits can sit behind a router you already have. Use eero’s article for the node you unboxed before you change that.",
    doubleNat: SHARED_DOUBLE_NAT,
    backhaul: "Use an ethernet cable between eero nodes only when that model’s guide says the port is for the link between nodes. Some eero nodes do not have ethernet ports.",
    pairing: "Add each eero in the eero app while it is near the gateway eero, then move it. The browser speed test cannot see which eero your phone is using.",
    firmware: SHARED_FIRMWARE,
    guest: SHARED_GUEST,
  },
  "google-nest": {
    mode: "Nest Wifi and Nest Wifi Pro are set up in the Google Home app. They are different products, so use the Google Home flow for the unit you unboxed.",
    doubleNat: SHARED_DOUBLE_NAT,
    backhaul: "A wired link is available only on models whose guide lists ethernet ports for that purpose. Do not assume a Nest point and a Nest router have the same ports.",
    pairing: "Add the router unit first in Google Home, then each point. Follow Google’s order if it differs from pairing one unit at a time near the router.",
    firmware: SHARED_FIRMWARE,
    guest: SHARED_GUEST,
  },
  "tp-link": {
    mode: "Deco kits are changed in the Deco app, which includes an operation mode. Many Archer routers also open a local admin page. Use TP-Link’s article for the model on the label before you switch between router mode and access-point mode.",
    doubleNat: SHARED_DOUBLE_NAT,
    backhaul: "An ethernet backhaul is model-specific. Use it only when the Deco or Archer guide says that port links the nodes. A wireless hop is normal when no cable exists.",
    pairing: SHARED_PAIRING,
    firmware: SHARED_FIRMWARE,
    guest: SHARED_GUEST,
  },
  netgear: {
    mode: "Orbi is managed in the Orbi app, and many NETGEAR routers also open a local admin page. NETGEAR documents router mode and access-point mode. Follow the article for the router unit, which is the unit that connects to the modem.",
    doubleNat: SHARED_DOUBLE_NAT,
    backhaul: "Use the ethernet backhaul steps in the Orbi article for your model. The satellite is not a substitute for the router unit.",
    pairing: "Sync the satellite the way that kit’s quick start describes, close to the router, then move it. Orbi router and satellite units are not interchangeable on every kit.",
    firmware: SHARED_FIRMWARE,
    guest: SHARED_GUEST,
  },
  asus: {
    mode: "ASUS documents wireless router mode, access point mode, and AiMesh. ZenWiFi and RT-series routers do not share one setup screen. Use the guide for the model on the label before you change the mode.",
    doubleNat: SHARED_DOUBLE_NAT,
    backhaul: "A wired AiMesh backhaul depends on the model. Use the ethernet steps in the ASUS guide, and leave the nodes wireless when that guide does not offer a wired hop.",
    pairing: "Add the AiMesh node from the ASUS Router app or the local admin page while it is near the primary router, then move it.",
    firmware: SHARED_FIRMWARE,
    guest: SHARED_GUEST,
  },
  linksys: {
    mode: "Velop is usually set up in the Linksys app. Many other Linksys routers also open a local admin page. Nodes from different Velop generations are not always compatible, so match the article to the model on the node.",
    doubleNat: SHARED_DOUBLE_NAT,
    backhaul: "Use ethernet between nodes only when the Linksys guide for that model calls the port a wired backhaul. Otherwise leave the link wireless.",
    pairing: SHARED_PAIRING,
    firmware: SHARED_FIRMWARE,
    guest: SHARED_GUEST,
  },
  other: {
    mode: "Router mode is the usual choice when this device replaces the ISP gateway. Access-point mode is the usual choice when another router already provides the internet. Use the printed quick start before you change either one.",
    doubleNat: SHARED_DOUBLE_NAT,
    backhaul: "A cable between units helps only when the vendor says that port is the link between them. This site cannot see how the nodes are connected.",
    pairing: SHARED_PAIRING,
    firmware: SHARED_FIRMWARE,
    guest: SHARED_GUEST,
  },
};

export function routerSetupNotes(manufacturerId: string): RouterSetupNotes {
  return NOTES[manufacturerId] ?? NOTES.other;
}

/** Mesh planner brand slug for a manufacturer and model choice. */
export function meshBrandFor(manufacturerId: string, modelId: string): string {
  if (manufacturerId === "eero") return "eero";
  if (manufacturerId === "google-nest") return "google-nest";
  if (manufacturerId === "tp-link" && modelId === "deco") return "tp-link-deco";
  if (manufacturerId === "netgear" && modelId === "orbi") return "netgear-orbi";
  if (manufacturerId === "asus" && modelId === "zenwifi") return "asus-zenwifi";
  if (manufacturerId === "linksys" && modelId === "velop") return "linksys-velop";
  return "generic";
}
