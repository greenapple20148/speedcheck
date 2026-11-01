import type { BackhaulChoice, Construction } from "@/lib/mesh/types";

export interface BackhaulAdvice {
  choice: BackhaulChoice;
  title: string;
  why: string;
  caution: string;
}

export function adviseBackhaul(input: {
  ethernetOutlets: number;
  coax: boolean;
  nodes: number;
  construction: Construction;
  current: BackhaulChoice;
}): BackhaulAdvice {
  if (input.ethernetOutlets >= 2 || (input.nodes <= 2 && input.ethernetOutlets >= 1)) {
    return {
      choice: "ethernet",
      title: "Prefer Ethernet between nodes when a cable is already there",
      why: "A wire keeps the link between nodes off the same radio as phones and laptops. That often matters more than adding another wireless hop.",
      caution: "Not every port on every model is a backhaul port. Check the guide for the exact model before you rely on a spare LAN port.",
    };
  }
  if (input.coax && input.ethernetOutlets < 2) {
    return {
      choice: "moca",
      title: "Coax may be worth a look before powerline",
      why: "If the rooms already have coax, a MoCA adapter can carry the link between nodes without a new Ethernet run. Confirm the mesh system can use a wired port for that link.",
      caution: "MoCA is not available on every coax outlet, and some TV setups already use the coax. This is a wiring option, not a promise that your model supports it.",
    };
  }
  if (input.current === "powerline") {
    return {
      choice: "powerline",
      title: "Powerline is a last resort in this checklist",
      why: "It can connect two rooms when no cable exists, but speed swings with the electrical circuit.",
      caution: "A slow powerline link can make the mesh slower than a careful wireless placement. Retest both ways.",
    };
  }
  return {
    choice: input.construction === "concrete" ? "wireless-dedicated" : "wireless-shared",
    title: input.construction === "concrete" ? "Wireless backhaul will be the hard part" : "Wireless backhaul can work if the nodes see each other",
    why: "Without a cable, each satellite has to reach another node through the air. Place them where that hop is short, not only where the sofa is.",
    caution: "Dedicated wireless backhaul exists only on some models and bands. Do not assume a dual-band system has a spare radio for the hop.",
  };
}
