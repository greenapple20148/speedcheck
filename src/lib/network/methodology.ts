/**
 * What the current engine includes in a throughput number.
 * Keep this aligned with src/lib/speedtest/engine.ts.
 */
export const THROUGHPUT_TIMING_NOTES = {
  download: [
    "A single small download runs first and is excluded from the result (connection warm-up).",
    "Timed download throughput uses bytes actually read from the response body.",
    "The clock for each chunk starts when the first body byte is read and stops at the last body byte, so connection setup before the first byte is left out of that chunk when the stream exposes chunks.",
    "Parallel chunks are combined as total bytes over the union of those windows: (bytes × 8) / (elapsed seconds × 1,000,000).",
    "If the browser buffers the whole body at once, that chunk falls back to the full request duration, which still includes setup.",
  ],
  upload: [
    "Payloads are zero-filled, not cryptographic random, because random generation on the main thread under-reported throughput.",
    "The measurement server sends Content-Encoding: identity and does not compress the body.",
    "Upload time starts immediately before the request and ends when the response completes, so connection setup is included.",
    "Byte count is the server-reported receivedBytes value, not the nominal payload size, when the server returns it.",
  ],
  latency: [
    "Latency is HTTP application round-trip time to the measurement endpoint, not ICMP ping.",
    "Standard tests take 21 samples and drop the first as warm-up (20 usable samples).",
    "Jitter is the mean absolute difference between successive valid samples.",
    "Loaded latency samples are taken about every 200 ms during the transfer and summarized with a median.",
  ],
} as const;

export const BUFFERBLOAT_GRADE_NOTE =
  "Letter grades use the project's documented latency-increase thresholds (A under 5 ms, B under 30 ms, C under 60 ms, D under 200 ms, otherwise F). They are an internal scale, not an industry certification.";
