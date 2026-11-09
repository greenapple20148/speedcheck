export interface LocationProvider {
  name: string;
  type: string;
  coverage: string;
  topSpeed: string;
}

export interface LocationPage {
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  summary: string;
  avgDownloadMbps: number;
  avgUploadMbps: number;
  providers: LocationProvider[];
  broadbandLandscape: string;
  tips: string[];
  faqs: Array<{ question: string; answer: string }>;
  indexed: boolean;
}

export const LOCATIONS: LocationPage[] = [
  {
    state: "New York",
    stateSlug: "ny",
    city: "New York City",
    citySlug: "new-york-city",
    summary:
      "New York City broadband is characterized by extensive fiber footprints alongside legacy coaxial cable networks. Dense multi-family apartment buildings create significant Wi-Fi channel crowding, making wired connections and 5 GHz/6 GHz bands crucial for high performance.",
    avgDownloadMbps: 310,
    avgUploadMbps: 185,
    providers: [
      { name: "Verizon Fios", type: "100% Fiber (FTTH)", coverage: "Extensive (85%+)", topSpeed: "Up to 2,000 Mbps symmetrical" },
      { name: "Spectrum", type: "Cable (DOCSIS 3.1)", coverage: "Citywide (Manhattan, Queens, Brooklyn, SI)", topSpeed: "Up to 1,000 Mbps download" },
      { name: "Optimum (Altice)", type: "Cable & Fiber", coverage: "Bronx & Brooklyn footprints", topSpeed: "Up to 1,000 – 8,000 Mbps" },
      { name: "Astound Broadband (RCN)", type: "Cable & Fiber", coverage: "Select high-rise buildings", topSpeed: "Up to 1,500 Mbps download" },
    ],
    broadbandLandscape:
      "Unlike suburban areas where a single cable company often holds a local monopoly, NYC residents frequently have a direct choice between Verizon Fios fiber and Spectrum/Optimum cable. However, internal building wiring (pre-war plaster walls, copper phone risers, and ancient coaxial splitters) is often the hidden bottleneck for apartment dwellers.",
    tips: [
      "Prefer 5 GHz or 6 GHz Wi-Fi over 2.4 GHz in crowded apartment buildings to escape interference from dozens of neighboring routers.",
      "Always test your connection via Ethernet once to separate outside ISP performance from inside apartment Wi-Fi congestion.",
      "Evening node congestion can slow down cable broadband between 8 PM and 11 PM; fiber connections remain consistent.",
      "In pre-war buildings with thick plaster and brick walls, place mesh nodes in direct line of sight through hallways.",
    ],
    faqs: [
      {
        question: "What is the fastest internet provider in New York City?",
        answer:
          "Verizon Fios is widely rated as the fastest and most reliable provider in NYC due to its 100% fiber-optic infrastructure delivering symmetrical gigabit speeds and sub-10 ms latency. In select buildings, Optimum Fiber also offers multi-gig tiers.",
      },
      {
        question: "Why is Wi-Fi so slow in NYC apartments?",
        answer:
          "Radio frequency congestion. In dense residential buildings, 20 to 50 neighboring Wi-Fi routers compete for the exact same radio channels. Switching your router to 5 GHz or Wi-Fi 6E (6 GHz) bypasses this interference.",
      },
      {
        question: "What is the average internet speed in New York City?",
        answer:
          "According to recent broadband test data, median download speeds in NYC average around 300 to 350 Mbps, with upload speeds averaging 150 to 200 Mbps in fiber-served boroughs.",
      },
    ],
    indexed: true,
  },
  {
    state: "California",
    stateSlug: "ca",
    city: "San Francisco",
    citySlug: "san-francisco",
    summary:
      "San Francisco boasts competitive fiber internet options, strong municipal tech infrastructure, and widespread gigabit availability. However, Victorian architectural layouts, steep hills, and multi-unit Victorian flats often degrade indoor Wi-Fi propagation.",
    avgDownloadMbps: 340,
    avgUploadMbps: 210,
    providers: [
      { name: "Sonic", type: "100% Fiber (FTTH)", coverage: "Rapidly expanding citywide", topSpeed: "Up to 10,000 Mbps (10G) symmetrical" },
      { name: "AT&T Fiber", type: "Fiber (FTTH)", coverage: "Extensive (70%+)", topSpeed: "Up to 5,000 Mbps symmetrical" },
      { name: "Xfinity (Comcast)", type: "Cable (DOCSIS 3.1)", coverage: "Nearly ubiquitous (95%+)", topSpeed: "Up to 1,200 Mbps download" },
      { name: "Monkeybrains", type: "Fixed Wireless", coverage: "Downtown & Mission footprints", topSpeed: "Up to 500 – 1,000 Mbps" },
    ],
    broadbandLandscape:
      "San Francisco is one of the most competitive fiber markets in North America, with local independent provider Sonic deploying affordable 10 Gigabit fiber alongside AT&T Fiber. Cable giant Xfinity covers almost every address. Remote software engineers and tech workers benefit greatly from symmetrical fiber uploads when pushing code, syncing cloud storage, and video conferencing.",
    tips: [
      "Place your router centrally and elevated—avoid tucking equipment behind heavy wooden desks or inside Victorian closets.",
      "Compare symmetrical fiber (Sonic or AT&T) vs cable (Xfinity) if work-from-home uploads and low ping matter.",
      "In multi-level Victorian flats, vertical Wi-Fi signals penetrate poorly through hardwood and lath-and-plaster ceilings; use a wired backhaul mesh system.",
      "Check address-level availability for Sonic 10G fiber, which is frequently cheaper and faster than traditional cable.",
    ],
    faqs: [
      {
        question: "Who is the best internet provider in San Francisco?",
        answer:
          "Sonic is widely considered the best provider in SF where available, offering symmetrical 10 Gbps fiber with exceptional customer service and no data caps. AT&T Fiber is a close second with symmetrical multi-gig tiers.",
      },
      {
        question: "Why does my internet drop in a multi-story San Francisco flat?",
        answer:
          "Older Victorian homes feature lath-and-plaster walls containing wire mesh, which severely attenuates radio waves. Running an Ethernet cable or utilizing existing coaxial cables with MoCA adapters connects floors much better than wireless repeating.",
      },
    ],
    indexed: true,
  },
  {
    state: "Texas",
    stateSlug: "tx",
    city: "Austin",
    citySlug: "austin",
    summary:
      "Austin is a premier tech hub with widespread multi-gigabit fiber deployment from Google Fiber and AT&T Fiber, alongside Spectrum cable. Sprawling suburban floor plans and attic heat are unique local networking challenges.",
    avgDownloadMbps: 360,
    avgUploadMbps: 230,
    providers: [
      { name: "Google Fiber", type: "100% Fiber (FTTH)", coverage: "Central Austin, South Congress, North", topSpeed: "Up to 8,000 Mbps (8G) symmetrical" },
      { name: "AT&T Fiber", type: "Fiber (FTTH)", coverage: "Extensive city & suburbs (80%+)", topSpeed: "Up to 5,000 Mbps symmetrical" },
      { name: "Spectrum", type: "Cable (DOCSIS 3.1)", coverage: "Ubiquitous metro coverage", topSpeed: "Up to 1,000 Mbps download" },
      { name: "Grande / Astound", type: "Cable & Fiber", coverage: "Select residential neighborhoods", topSpeed: "Up to 1,500 Mbps download" },
    ],
    broadbandLandscape:
      "Austin was one of the earliest flagship cities for Google Fiber, which ignited aggressive fiber buildouts by AT&T. Today, Austin residents enjoy some of the highest average broadband speeds and lowest fiber prices in the nation. Symmetrical gigabit plans dominate residential areas.",
    tips: [
      "Check address-level fiber coverage with both Google Fiber and AT&T before settling for coaxial cable.",
      "Avoid placing gateways or routers inside hot attics or garage media panels—Texas summer heat throttles router CPUs and degrades Wi-Fi radios.",
      "In modern 2,500+ sq ft single-story Texas ranch homes, a single central router often leaves bedrooms in dead zones; plan for a 2-node or 3-node mesh setup.",
      "Look for pre-wired Cat5e or Cat6 Ethernet wall jacks installed in homes built after 2005 for wired mesh backhaul.",
    ],
    faqs: [
      {
        question: "Is Google Fiber or AT&T Fiber better in Austin?",
        answer:
          "Both offer exceptional symmetrical fiber speeds with sub-10 ms latency and unlimited data. Google Fiber is renowned for transparent pricing and provided Wi-Fi 6E hardware, while AT&T Fiber has wider coverage in newer suburban developments.",
      },
      {
        question: "Why do routers overheat and slow down in Austin homes?",
        answer:
          "Homebuilders often install networking equipment panels inside closets near attics. High ambient temperatures cause modem chips to thermally throttle throughput. Keep networking gear in a ventilated, air-conditioned room.",
      },
    ],
    indexed: true,
  },
];

export function getLocation(state: string, city: string) {
  return LOCATIONS.find((l) => l.stateSlug === state && l.citySlug === city);
}
