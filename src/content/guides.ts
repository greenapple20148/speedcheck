export interface Guide {
  slug: string;
  title: string;
  description: string;
  reviewed: string;
  toolHref: string;
  toolLabel: string;
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { question: string; answer: string }[];
  related: { href: string; label: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: "what-is-bufferbloat",
    title: "What Is Bufferbloat?",
    description:
      "Bufferbloat is extra delay that appears when a full link queues packets. Learn how to see it and what a retest should show.",
    reviewed: "2026-11-01",
    toolHref: "/bufferbloat-test",
    toolLabel: "Run a bufferbloat test",
    sections: [
      {
        heading: "The symptom",
        paragraphs: [
          "A speed test can report plenty of megabits while a call or game falls apart the moment a download starts. The link is not “slow” in throughput. It is waiting in a queue.",
          "Routers and modems buffer data so short bursts do not get dropped. When the buffer is large and unmanaged, every new packet waits behind a transfer that already filled the pipe.",
        ],
      },
      {
        heading: "How to see it",
        paragraphs: [
          "Measure idle HTTP latency, then measure it again while a download and an upload are running. The useful number is the increase, not a letter grade by itself.",
          "MySpeedGauge’s grade is an internal scale documented on the methodology page. It is not a certification.",
        ],
      },
      {
        heading: "What to change, one step at a time",
        paragraphs: [
          "Pause other transfers and repeat the test. If the increase shrinks, something in the house was filling the queue.",
          "If the router offers SQM or a simple QoS mode aimed at latency, enable it and repeat the same test. A smaller gap between idle and loaded latency is the result that matters.",
          "Compare Ethernet with Wi-Fi only after the wired result is known. Do not replace hardware because a single wireless test looked uneven.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does more bandwidth fix bufferbloat?",
        answer:
          "A faster plan raises the ceiling, but a full faster link can still queue. Queue management addresses the delay directly.",
      },
    ],
    related: [
      { href: "/bufferbloat-test", label: "Bufferbloat test" },
      { href: "/methodology", label: "Methodology" },
    ],
  },
  {
    slug: "what-is-latency",
    title: "What Is Latency?",
    description:
      "Latency is delay, not speed. See how HTTP round-trip time differs from ICMP ping and from in-game numbers.",
    reviewed: "2026-11-01",
    toolHref: "/ping-test",
    toolLabel: "Measure HTTP latency",
    sections: [
      {
        heading: "Delay versus throughput",
        paragraphs: [
          "Throughput is how much data arrives per second. Latency is how long one round trip takes. A connection can move a lot of data and still feel late.",
          "Jitter is the change from one round trip to the next. A stable 40 ms is easier to play on than a median of 30 ms that keeps jumping.",
        ],
      },
      {
        heading: "What a browser can measure",
        paragraphs: [
          "This site measures HTTP request time to its measurement endpoint. That includes more than an ICMP echo. It is the delay an application on this path actually waits.",
          "It is not the number inside a game. Game clients use their own servers and often UDP. Use both numbers for different questions.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is loaded latency?",
        answer:
          "It is the round trip while a download or upload is already moving. If it rises far above the idle figure, the line is queuing.",
      },
    ],
    related: [
      { href: "/ping-test", label: "Ping test" },
      { href: "/jitter-test", label: "Jitter test" },
    ],
  },
  {
    slug: "why-upload-is-slower-than-download",
    title: "Why Is Upload Speed Slower Than Download?",
    description:
      "Most home plans are asymmetric. Here is how to tell a designed gap from an upload that is actually missing.",
    reviewed: "2026-11-01",
    toolHref: "/slow-upload-speed",
    toolLabel: "Measure upload",
    sections: [
      {
        heading: "The plan is often built this way",
        paragraphs: [
          "Cable and many fiber tiers sell a large download and a much smaller upload. Cloud backup, cameras, and video calls all use the smaller number.",
          "A 10-to-1 ratio can be normal. Compare your measurement with the upload speed on the bill, not with the download speed.",
        ],
      },
      {
        heading: "When it is worth a second test",
        paragraphs: [
          "If Ethernet upload is close to the plan, Wi-Fi or another device is the next place to look.",
          "If Ethernet upload stays far below the plan at a quiet hour, save the result and ask the provider with both numbers. One test does not prove a failed modem.",
        ],
      },
    ],
    faqs: [
      {
        question: "Will a mesh system raise upload?",
        answer:
          "Only if the limit was Wi-Fi. It cannot raise the upload your provider delivers on the wire.",
      },
    ],
    related: [
      { href: "/slow-upload-speed", label: "Upload test" },
      { href: "/video-call-test", label: "Video call test" },
    ],
  },
  {
    slug: "how-to-reduce-ping-while-gaming",
    title: "How to Reduce Ping While Gaming",
    description:
      "Lower home-network delay before you chase a game-server number this site does not measure.",
    reviewed: "2026-11-01",
    toolHref: "/gaming-speed-test",
    toolLabel: "Run the gaming test",
    sections: [
      {
        heading: "Measure the part you control",
        paragraphs: [
          "Run the HTTP latency test on Wi-Fi, then on Ethernet, with downloads paused. A drop on the cable means the radio was adding delay.",
          "If latency only spikes while a download runs, you are looking at queueing. The bufferbloat test is the right follow-up. A closer game server will not fix a full uplink.",
        ],
      },
      {
        heading: "What not to trust",
        paragraphs: [
          "MySpeedGauge does not query Fortnite, Valorant, Roblox, or other game hosts. An in-game network screen is the measurement for that title.",
          "Changing one setting at a time is the whole method. A bundle of new hardware plus a new DNS plus a new channel teaches you nothing about which change mattered.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does a gaming VPN lower ping?",
        answer:
          "Sometimes a different route is shorter, and sometimes it is longer. Keep a before-and-after measurement. Do not assume it helps.",
      },
    ],
    related: [
      { href: "/gaming-speed-test", label: "Gaming test" },
      { href: "/high-ping-fix", label: "High latency checks" },
    ],
  },
  {
    slug: "how-fast-is-100-mbps",
    title: "How Fast Is 100 Mbps?",
    description:
      "What 100 megabits per second can carry, in megabytes and in everyday tasks, and what it does not guarantee.",
    reviewed: "2026-11-01",
    toolHref: "/download-time-calculator",
    toolLabel: "Calculate a download time",
    sections: [
      {
        heading: "The unit",
        paragraphs: [
          "100 Mbps is 100 million bits per second, or 12.5 decimal megabytes per second if the transfer really holds that rate. In binary mebibytes that is about 11.9 MiB/s.",
          "A 1 GB file (decimal) is 8,000 megabits. At a steady 100 Mbps the theoretical time is 80 seconds. Overhead makes real copies longer. The download calculator can apply an efficiency factor.",
        ],
      },
      {
        heading: "What it covers",
        paragraphs: [
          "One 4K stream is often planned around 25 Mbps, so 100 Mbps can cover a few streams if they are the only traffic. A video call wants upload as well. 100 Mbps down says nothing about a 10 Mbps upload.",
          "Latency is separate. A 100 Mbps line with a large buffer can still feel late in games. Measure both.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is 100 Mbps fast?",
        answer:
          "It is enough for several people browsing and streaming in HD if the upload and the Wi-Fi keep up. It is not a gigabit plan, and it is not a latency measurement.",
      },
    ],
    related: [
      { href: "/mbps-to-mbs", label: "Mbps to MB/s" },
      { href: "/streaming-speed-test", label: "Streaming test" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
