export type Symptom =
  | "slow"
  | "wifi-drops"
  | "gaming-lag"
  | "video-freeze"
  | "streaming-buffer"
  | "slow-upload"
  | "high-ping"
  | "slow-at-night";

export type Confidence = "low" | "medium" | "high";

export interface TroubleshootContext {
  symptoms: Symptom[];
  link: "wifi" | "ethernet" | "unknown";
  device: "phone" | "computer" | "tv" | "console" | "unknown";
  advertisedDownloadMbps: number | null;
  connectedDevices: number | null;
  affectsMultipleDevices: boolean | null;
  pattern: "continuous" | "intermittent" | "unknown";
}

export interface MeasurementSnapshot {
  downloadMbps: number | null;
  uploadMbps: number | null;
  pingMs: number | null;
  jitterMs: number | null;
  /** Loaded median minus idle median, when both exist. */
  loadedLatencyIncreaseMs: number | null;
  endpointId: string | null;
}

export interface Recommendation {
  id: string;
  title: string;
  why: string;
  howToTest: string;
  expectedImprovement: string;
  confidence: Confidence;
  guideHref?: string;
  guideLabel?: string;
}

export interface TroubleshootResult {
  diagnosis: string;
  measuredNotes: string[];
  missing: string[];
  recommendations: Recommendation[];
}

const SIGNIFICANT_INCREASE_MS = 30;

function num(n: number | null | undefined): n is number {
  return n != null && Number.isFinite(n);
}

export function troubleshoot(
  context: TroubleshootContext,
  measurement: MeasurementSnapshot | null,
): TroubleshootResult {
  if (context.symptoms.length === 0) {
    return {
      diagnosis: "Select at least one symptom to get a checklist.",
      measuredNotes: [],
      missing: ["Symptoms"],
      recommendations: [],
    };
  }

  const measuredNotes: string[] = [];
  const missing: string[] = [];
  const recommendations: Recommendation[] = [];

  if (!measurement) {
    missing.push("A completed speed test on this device");
  } else {
    if (num(measurement.downloadMbps)) {
      measuredNotes.push(`Download ${measurement.downloadMbps.toFixed(1)} Mbps`);
    } else missing.push("Download speed");
    if (num(measurement.uploadMbps)) {
      measuredNotes.push(`Upload ${measurement.uploadMbps.toFixed(1)} Mbps`);
    } else missing.push("Upload speed");
    if (num(measurement.pingMs)) {
      measuredNotes.push(`Idle HTTP RTT ${measurement.pingMs.toFixed(0)} ms`);
    } else missing.push("Idle latency");
    if (num(measurement.loadedLatencyIncreaseMs)) {
      measuredNotes.push(
        `Latency rose ${measurement.loadedLatencyIncreaseMs.toFixed(0)} ms under load`,
      );
    } else missing.push("Latency under load");
    if (measurement.endpointId) {
      measuredNotes.push(`Endpoint ${measurement.endpointId}`);
    }
  }

  const download = measurement?.downloadMbps ?? null;
  const upload = measurement?.uploadMbps ?? null;
  const ping = measurement?.pingMs ?? null;
  const jitter = measurement?.jitterMs ?? null;
  const increase = measurement?.loadedLatencyIncreaseMs ?? null;
  const symptoms = new Set(context.symptoms);

  const queueing =
    num(increase) &&
    increase >= SIGNIFICANT_INCREASE_MS &&
    num(download) &&
    download >= 25;

  const belowPlan =
    num(download) &&
    num(context.advertisedDownloadMbps) &&
    context.advertisedDownloadMbps > 0 &&
    download < context.advertisedDownloadMbps * 0.5;

  let diagnosis: string;

  if (queueing) {
    diagnosis =
      "Your connection may be experiencing congestion or queueing delays under load. Download throughput is usable, but latency climbed while data was moving.";
    recommendations.push({
      id: "sqm",
      title: "Enable SQM or QoS if the router supports it",
      why: "Smart queue management keeps latency down when a transfer fills the link.",
      howToTest: "Turn SQM on, then run the bufferbloat test again with no other large transfers.",
      expectedImprovement: "Latency under load should move closer to the idle HTTP RTT.",
      confidence: increase >= 60 ? "high" : "medium",
      guideHref: "/guides/what-is-bufferbloat",
      guideLabel: "What is bufferbloat?",
    });
    recommendations.push({
      id: "busy-line",
      title: "Check for other uploads or downloads",
      why: "Cloud backup, game updates, and cameras can fill the uplink and add delay for everyone.",
      howToTest: "Pause those apps and rerun the bufferbloat test.",
      expectedImprovement: "Loaded latency should drop if another device was saturating the line.",
      confidence: "medium",
    });
  } else if (belowPlan && context.affectsMultipleDevices === true) {
    diagnosis =
      "Measured download is well below the advertised plan, and you said more than one device is affected. That pattern can come from the ISP path or shared router, but this test cannot name a failed part.";
    recommendations.push({
      id: "wired-compare",
      title: "Compare a wired device with Wi-Fi",
      why: "A wired test removes the wireless hop so you can see whether the shortfall is in the air or on the WAN.",
      howToTest: "Run a speed test on Ethernet, then repeat on Wi-Fi in the same room as the router.",
      expectedImprovement: "If Ethernet matches the plan and Wi-Fi does not, the wireless path is the gap.",
      confidence: "medium",
      guideHref: "/wifi-vs-ethernet",
      guideLabel: "Wi-Fi vs Ethernet",
    });
  } else if (symptoms.has("slow-at-night")) {
    diagnosis =
      "Evening slowdowns are often shared-neighborhood congestion, but one test cannot prove a time-of-day pattern.";
    recommendations.push({
      id: "time-compare",
      title: "Retest at a quiet hour and again in the evening",
      why: "A pair of saved results shows whether throughput or latency actually changes with the time of day.",
      howToTest: "Save a morning test and an evening test from the same device and connection type.",
      expectedImprovement: "A large, repeatable evening drop points to congestion rather than a single bad moment.",
      confidence: "low",
      guideHref: "/guides/why-is-my-internet-slow",
      guideLabel: "Why is my internet slow?",
    });
  } else if (symptoms.has("wifi-drops") && context.link !== "ethernet") {
    diagnosis =
      "Repeated Wi-Fi disconnects are a stability problem. A single speed number does not show why the radio drops.";
    recommendations.push({
      id: "wifi-stability",
      title: "Separate wireless drops from internet drops",
      why: "If Ethernet stays up while Wi-Fi reconnects, the ISP link is not the thing failing.",
      howToTest: "Use Ethernet for an hour. If the wired device stays online, focus on distance, band, and interference.",
      expectedImprovement: "Fewer reconnects on 5 GHz or Ethernet, without assuming the router hardware has failed.",
      confidence: "low",
      guideHref: "/guides/how-to-improve-wifi-speed",
      guideLabel: "How to improve Wi-Fi speed",
    });
  } else if (
    symptoms.has("slow-upload") ||
    (num(download) && num(upload) && download > 0 && upload / download < 0.15)
  ) {
    diagnosis = num(upload)
      ? "Upload is much lower than download. Many home plans are built that way, and it limits video calls and backups even when downloads feel fast."
      : "Slow uploads need a measured upload number before they can be compared with the plan.";
    recommendations.push({
      id: "upload-measure",
      title: "Measure upload, then retry the call or backup",
      why: "Video calls and cloud backups use the uplink. Download speed does not describe that direction.",
      howToTest: "Run a speed test, note upload Mbps, then repeat the task with other uploads paused.",
      expectedImprovement: "Calls should stabilize if upload was saturated and is now free.",
      confidence: num(upload) ? "medium" : "low",
      guideHref: "/slow-upload-speed",
      guideLabel: "Slow upload speed",
    });
  } else if (symptoms.has("gaming-lag") || symptoms.has("high-ping")) {
    diagnosis = num(ping)
      ? `Idle HTTP round-trip to the measurement endpoint is about ${ping.toFixed(0)} ms. That is not the latency to a game publisher's servers.`
      : "Gaming lag needs an HTTP latency measurement first. This app does not ping game servers directly.";
    recommendations.push({
      id: "game-path",
      title: "Reduce local delay, then compare wired and wireless",
      why: "Wi-Fi retries and busy uploads add delay before traffic even leaves your home.",
      howToTest: "Run the ping test on Ethernet and on Wi-Fi. Save both. Do not treat either number as in-game ping.",
      expectedImprovement: "A lower idle HTTP RTT and lower jitter on the wired test if Wi-Fi was adding delay.",
      confidence: num(ping) ? "medium" : "low",
      guideHref: "/guides/how-to-reduce-ping-while-gaming",
      guideLabel: "How to reduce ping while gaming",
    });
    if (num(jitter) && jitter >= 15) {
      recommendations.push({
        id: "jitter",
        title: "Treat high jitter as instability, not just a high average",
        why: "Games feel uneven when delay swings, even if the median looks acceptable.",
        howToTest: "Run the jitter test with nearby devices idle, then again while someone streams.",
        expectedImprovement: "A smaller gap between successive HTTP RTT samples.",
        confidence: "medium",
        guideHref: "/jitter-test",
        guideLabel: "Jitter test",
      });
    }
  } else if (symptoms.has("video-freeze") || symptoms.has("streaming-buffer")) {
    diagnosis =
      symptoms.has("video-freeze")
        ? "Video calls need stable upload, modest download, and latency that stays low while the line is busy."
        : "Streaming trouble can be low throughput or latency spikes under load. The next test should separate those.";
    recommendations.push({
      id: "call-or-stream",
      title: "Run a standard speed test and read latency under load",
      why: "A fast idle download can still stutter if latency jumps while the call or stream is moving data.",
      howToTest: "Use the video call test or streaming test, then change one thing (wired, closer to the router, paused backups) and repeat.",
      expectedImprovement: "Higher upload for calls, or a smaller latency increase for streams that were stalling under load.",
      confidence: measurement ? "medium" : "low",
      guideHref: symptoms.has("video-freeze") ? "/video-call-test" : "/streaming-speed-test",
      guideLabel: symptoms.has("video-freeze") ? "Video call test" : "Streaming test",
    });
  } else {
    diagnosis =
      "The selected symptoms need a measurement before a narrower cause is justified. Start with a speed test on the connection you actually use.";
    recommendations.push({
      id: "measure-first",
      title: "Run one standard test and save it",
      why: "Recommendations stay generic until download, upload, and latency are measured on this device.",
      howToTest: "Open the speed test, run it once, then return here. The latest saved result is included automatically.",
      expectedImprovement: "The diagnosis can then distinguish a slow link from delay under load.",
      confidence: "low",
      guideHref: "/speed-test",
      guideLabel: "Speed test",
    });
  }

  if (context.link === "wifi" && !recommendations.some((r) => r.id === "wired-compare")) {
    recommendations.push({
      id: "wifi-check",
      title: "Repeat the same test on Ethernet if you can",
      why: "Wi-Fi adds a variable hop. A single wireless result mixes the ISP link with the radio.",
      howToTest: "Plug in with a cable, rerun the same test, and compare download and idle HTTP RTT.",
      expectedImprovement: "Higher throughput or steadier latency on Ethernet means the wireless hop was part of the gap.",
      confidence: "low",
      guideHref: "/wifi-vs-ethernet",
      guideLabel: "Wi-Fi vs Ethernet",
    });
  }

  return {
    diagnosis,
    measuredNotes,
    missing,
    recommendations: recommendations.slice(0, 4),
  };
}
