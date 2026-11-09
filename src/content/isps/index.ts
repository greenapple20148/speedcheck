export interface IspPlan {
  name: string;
  downloadMbps: number;
  uploadMbps: number;
  idealFor: string;
}

export interface IspPage {
  slug: string;
  name: string;
  technology: string;
  description: string;
  typicalDownloadMbps: [number, number];
  typicalUploadMbps: [number, number];
  plans: IspPlan[];
  equipmentAdvice: string;
  notes: string[];
  faqs: Array<{ question: string; answer: string }>;
  indexed: boolean;
}

export const ISPS: IspPage[] = [
  {
    slug: "xfinity",
    name: "Xfinity",
    technology: "Cable DOCSIS 3.1 & Next-Gen DOCSIS 4.0",
    description:
      "Xfinity (Comcast) is the largest cable broadband provider in the United States, offering high-speed hybrid fiber-coaxial (HFC) internet across 39 states. Plans feature fast download speeds up to 1,200–2,000 Mbps with asymmetric upload speeds in most markets.",
    typicalDownloadMbps: [100, 1200],
    typicalUploadMbps: [10, 35],
    plans: [
      { name: "Connect More", downloadMbps: 300, uploadMbps: 10, idealFor: "1–2 users, casual streaming and web browsing" },
      { name: "Fast", downloadMbps: 500, uploadMbps: 20, idealFor: "3–4 users, remote work, simultaneous 4K streams" },
      { name: "Superfast", downloadMbps: 800, uploadMbps: 25, idealFor: "Busy households, fast game downloads, cloud sync" },
      { name: "Gigabit Extra", downloadMbps: 1200, uploadMbps: 35, idealFor: "Power users, competitive gamers, heavy smart homes" },
    ],
    equipmentAdvice:
      "You can rent Xfinity's xFi Gateway (XB7/XB8) or purchase your own approved DOCSIS 3.1 modem (such as Arris SURFboard SB8200 or Motorola MB8611) to save equipment rental fees. If using a third-party mesh system, place the xFi Gateway into Bridge Mode.",
    notes: [
      "Cable networks share neighborhood distribution nodes—speeds may dip by 10% to 20% during peak evening hours (7 PM to 11 PM).",
      "Upload speeds are asymmetric on standard tiers (typically 10 to 35 Mbps), though mid-split upgrades are rolling out higher upload speeds in select cities.",
      "Most Xfinity markets have a 1.2 TB monthly data cap unless you subscribe to xFi Complete or unlimited data add-ons.",
      "Check that your coaxial wall outlet is tight and connected to a high-frequency (5–1002 MHz) splitter to prevent packet loss.",
    ],
    faqs: [
      {
        question: "Why is my Xfinity speed test slower than what I pay for?",
        answer:
          "Wi-Fi interference, older modem firmware, or testing over 2.4 GHz Wi-Fi are the most common causes. Connect your PC directly to your xFi Gateway with an Ethernet cable to confirm your true line speed.",
      },
      {
        question: "Does Xfinity offer symmetrical upload speeds?",
        answer:
          "In select 'Next Generation' markets undergoing DOCSIS mid-split and high-split upgrades, Xfinity is beginning to offer upload speeds up to 100 to 200 Mbps. However, most markets currently remain asymmetric with 10 to 35 Mbps upload.",
      },
      {
        question: "How do I fix lag spikes on Xfinity internet?",
        answer:
          "Restart your xFi Gateway through the Xfinity app, check for loose coaxial cable connections, and verify that your router does not suffer from bufferbloat during household uploads by running our bufferbloat test.",
      },
    ],
    indexed: true,
  },
  {
    slug: "verizon-fios",
    name: "Verizon Fios",
    technology: "Fiber-to-the-Home (FTTH / GPON & NG-PON2)",
    description:
      "Verizon Fios is a 100% fiber-optic broadband service available across the Mid-Atlantic and Northeast US. Fios delivers symmetrical download and upload speeds with exceptionally low ping and zero data caps.",
    typicalDownloadMbps: [300, 2000],
    typicalUploadMbps: [300, 2000],
    plans: [
      { name: "Fios 300 Mbps", downloadMbps: 300, uploadMbps: 300, idealFor: "Most families, HD/4K streaming, lag-free gaming" },
      { name: "Fios 500 Mbps", downloadMbps: 500, uploadMbps: 500, idealFor: "Multiple simultaneous video calls, heavy downloads" },
      { name: "Fios 1 Gigabit", downloadMbps: 940, uploadMbps: 880, idealFor: "Content creators, remote tech workers, large file transfers" },
      { name: "Fios 2 Gigabit", downloadMbps: 2000, uploadMbps: 2000, idealFor: "Enthusiasts with 2.5G/10G home networks and NAS servers" },
    ],
    equipmentAdvice:
      "Verizon installs an Optical Network Terminal (ONT) at your home, which outputs a standard Ethernet handoff. You can connect any third-party Wi-Fi 6 or mesh router directly to the ONT via Ethernet without needing to rent a Verizon router (unless you also have Fios TV set-top boxes).",
    notes: [
      "Fiber offers true symmetrical upload and download speeds, making Fios ideal for remote work, Zoom, and cloud backups.",
      "Latency is exceptionally low (typically 3 to 12 ms to nearby servers) because fiber experiences zero radio frequency interference.",
      "Verizon Fios has no monthly data caps or overage charges across all internet tiers.",
      "Because Fios does not share neighborhood coax nodes, evening peak slowdowns are practically non-existent.",
    ],
    faqs: [
      {
        question: "Why is Verizon Fios better than cable internet?",
        answer:
          "Fios uses 100% fiber-optic glass all the way into your home. This delivers symmetrical upload speeds (up to 1,000 Mbps upload vs 20 Mbps on cable), significantly lower latency (ping), and immune resistance to electrical weather interference.",
      },
      {
        question: "Can I use my own router with Verizon Fios?",
        answer:
          "Yes! Because the Verizon ONT outputs a standard RJ45 Ethernet connection, you can plug your own router, mesh system, or firewall directly into the ONT without paying monthly router rental fees.",
      },
      {
        question: "What should I do if my Fios speed test is low?",
        answer:
          "Verify that your Ethernet cable between the ONT and router is rated Cat5e or Cat6. If testing on Wi-Fi, ensure your device is connected to the 5 GHz or 6 GHz band rather than 2.4 GHz.",
      },
    ],
    indexed: true,
  },
  {
    slug: "att-fiber",
    name: "AT&T Fiber",
    technology: "Fiber-to-the-Home (FTTH / XGS-PON)",
    description:
      "AT&T Fiber is a premier high-speed fiber broadband network expanding across 21 states in the US South, Midwest, and West. Powered by modern XGS-PON technology, AT&T delivers symmetrical multi-gigabit speeds with unlimited data and ultra-low ping.",
    typicalDownloadMbps: [300, 5000],
    typicalUploadMbps: [300, 5000],
    plans: [
      { name: "Fiber 300", downloadMbps: 300, uploadMbps: 300, idealFor: "Everyday streaming, remote work, casual multiplayer" },
      { name: "Fiber 500", downloadMbps: 500, uploadMbps: 500, idealFor: "Large households, multiple 4K streams, smooth calls" },
      { name: "Fiber 1 GIG", downloadMbps: 1000, uploadMbps: 1000, idealFor: "Gigabit downloads, content creation, home lab servers" },
      { name: "Fiber 2 GIG / 5 GIG", downloadMbps: 2000, uploadMbps: 2000, idealFor: "Power users with multi-gig Ethernet switches and Wi-Fi 7" },
    ],
    equipmentAdvice:
      "AT&T provides the BGW320 Wi-Fi 6 gateway, which has a built-in optical transceiver. To use your own router or mesh system, enable 'IP Passthrough' mode in the BGW320 admin settings and disable the gateway's built-in Wi-Fi radios.",
    notes: [
      "Delivers true symmetrical download and upload speeds up to 5,000 Mbps with unlimited data.",
      "Consistently achieves sub-15 ms latency, making it premier for esports and cloud gaming.",
      "Requires AT&T's provided gateway hardware, but IP Passthrough mode allows full third-party router integration.",
      "Make sure you are on true 100% Fiber and not legacy AT&T DSL (Internet Air / U-verse), which operates over copper.",
    ],
    faqs: [
      {
        question: "Is AT&T Fiber symmetrical?",
        answer:
          "Yes! All AT&T Fiber plans offer equal upload and download speeds (e.g. 300/300 Mbps, 500/500 Mbps, 1000/1000 Mbps).",
      },
      {
        question: "How do I use my own mesh router with AT&T Fiber?",
        answer:
          "Log into the AT&T BGW320 gateway at 192.168.1.254, go to Firewall $\rightarrow$ IP Passthrough, set the Allocation Mode to Passthrough, select your router's MAC address, and turn off the gateway's 2.4 GHz and 5 GHz Wi-Fi radios.",
      },
      {
        question: "Why does my AT&T Fiber test slow on Wi-Fi?",
        answer:
          "Even on a 1 Gbps fiber plan, standard smartphone and laptop Wi-Fi links top out around 400 to 700 Mbps on Wi-Fi 6. To verify your full 1,000 Mbps speed, connect via Cat6 Ethernet to a 1G or 2.5G port on the gateway.",
      },
    ],
    indexed: true,
  },
];

export function getIsp(slug: string) {
  return ISPS.find((i) => i.slug === slug);
}
