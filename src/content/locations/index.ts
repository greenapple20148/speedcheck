export interface LocationPage {
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  summary: string;
  tips: string[];
  indexed: boolean;
}

export const LOCATIONS: LocationPage[] = [
  {
    state: "New York",
    stateSlug: "ny",
    city: "New York City",
    citySlug: "new-york-city",
    summary:
      "New York City residents commonly have access to cable and growing fiber footprints. Dense apartment Wi‑Fi interference is a frequent cause of slow indoor speeds.",
    tips: [
      "Prefer 5 GHz or 6 GHz Wi‑Fi in crowded apartment buildings.",
      "Test once on Ethernet to separate ISP issues from building Wi‑Fi noise.",
      "Evening congestion can appear on cable nodes in dense neighborhoods.",
    ],
    indexed: true,
  },
  {
    state: "California",
    stateSlug: "ca",
    city: "San Francisco",
    citySlug: "san-francisco",
    summary:
      "San Francisco has competitive fiber and cable options in many neighborhoods. Hills and multi-unit buildings often reduce Wi‑Fi range.",
    tips: [
      "Place the router centrally and elevated—avoid cabinets.",
      "Compare fiber vs cable plans if upload matters for work-from-home.",
    ],
    indexed: true,
  },
  {
    state: "Texas",
    stateSlug: "tx",
    city: "Austin",
    citySlug: "austin",
    summary:
      "Austin offers a mix of fiber, cable, and fixed wireless. New construction fiber buildouts continue to expand coverage.",
    tips: [
      "Check address-level fiber availability before assuming cable is the only option.",
      "Heat and attic gateway placements can throttle Wi‑Fi radios—keep equipment cool.",
    ],
    indexed: true,
  },
];

export function getLocation(state: string, city: string) {
  return LOCATIONS.find((l) => l.stateSlug === state && l.citySlug === city);
}
