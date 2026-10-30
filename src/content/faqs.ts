import type { FaqItem } from "@/components/seo/faq-section";

export const HOME_FAQS: FaqItem[] = [
  {
    question: "How does SpeedCheck measure internet speed?",
    answer:
      "SpeedCheck runs a real transfer against our measurement servers. Download streams random bytes to your browser; upload sends random bytes back. We calculate Mbps from transferred bytes and monotonic elapsed time—never mocked values.",
  },
  {
    question: "Why do results differ from other speed tests?",
    answer:
      "Servers, concurrent connections, test duration, caching, and your local Wi‑Fi all affect results. SpeedCheck avoids intermediary caching and compression, but your environment still introduces natural variability of roughly ±10–20%.",
  },
  {
    question: "What is a good internet speed?",
    answer:
      "For HD streaming, 25 Mbps down is usually enough for one device. 4K and heavy households often want 100–300 Mbps. Competitive online gaming cares more about low ping and jitter than peak Mbps.",
  },
  {
    question: "Does SpeedCheck store my IP address?",
    answer:
      "No. By default we do not store raw IP addresses. We may show a masked IP in your browser for convenience and store privacy-safe aggregates when you opt in to share results.",
  },
  {
    question: "What is the difference between lightweight and standard tests?",
    answer:
      "Lightweight uses fewer connections and a smaller data budget (about 20 MB). Standard uses more connections and up to about 80 MB for better accuracy on fast links. Both enforce server-side quotas.",
  },
];

export const WIFI_FAQS: FaqItem[] = [
  {
    question: "Should I test Wi‑Fi or Ethernet?",
    answer:
      "Test both. Ethernet reveals your true ISP throughput. Wi‑Fi reveals wireless bottlenecks from interference, distance, or older routers.",
  },
  {
    question: "Why is Wi‑Fi slower than my plan?",
    answer:
      "Common causes include 2.4 GHz congestion, thick walls, outdated Wi‑Fi standards, too many devices, or ISP gateway Wi‑Fi radios sharing CPU with routing.",
  },
];
