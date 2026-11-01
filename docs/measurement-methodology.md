# Measurement methodology

## Throughput

Mbps = (bytes transferred × 8) / (elapsed seconds × 1,000,000).

Bytes are counted from the response body, or from `receivedBytes` on upload. A URL’s nominal size is not used when the server reports a different count.

Download:

- One small transfer runs first and is omitted from the total (warm-up).
- When the browser streams the body, each chunk’s clock starts at the first byte read and ends at the last byte. Time before that first byte is outside the chunk window.
- Parallel chunks combine as total bytes over the union of those windows.
- If the body arrives as a single buffer, that chunk uses the full request duration, which still includes connection setup.

Upload:

- The body is zero-filled. Cryptographic random fills on the main thread under-reported throughput, and the Go server sets `Content-Encoding: identity`.
- The clock starts immediately before `fetch` and stops when the response completes, so connection setup is included.
- The byte count prefers the server’s `receivedBytes`.

Tests stop at the session duration and the client budget (40% of the signed byte budget per direction) and can be aborted.

## Latency and jitter

Probes are HTTP GETs to `/ping` on the same endpoint as the throughput test. They are not ICMP.

A standard speed test takes 21 samples and drops the first. Jitter is the mean absolute difference between successive valid samples. Loaded probes start before the transfer workers and continue about every 200 ms until those workers finish. The loaded figure is a median.

On HTTP/1.1 the browser allows about six connections per host. While loaded latency is being sampled, the client opens at most four throughput connections so a probe can be in flight at the same time as the transfer. HTTP/2 multiplexes those requests on fewer connections. The probes still measure HTTP round trip to this endpoint, not ICMP.

The dedicated ping tool uses the same definitions.

## Bufferbloat

Idle median, download-loaded median, and upload-loaded median are reported separately. Increase = loaded − idle, floored at zero.

Grades use `src/lib/speedtest/bufferbloat-config.ts`:

| Increase | Grade |
| --- | --- |
| < 5 ms | A |
| < 30 ms | B |
| < 60 ms | C |
| < 200 ms | D |
| otherwise | F |

This is an internal scale, not an industry certification.

## Request loss, stability, DNS

Request loss is failed HTTP requests divided by attempts. It is labeled application-level request loss.

Stability runs only for 30 seconds, 60 seconds, or 5 minutes, and stops on cancel or navigation.

DNS time is `domainLookupEnd - domainLookupStart` when both are positive. Otherwise the UI says unavailable. HTTP duration is not labeled as DNS.

## Failure

If the measurement config is not ready, or `MEASUREMENT_TESTS_ENABLED=false`, controls explain that and do not show a fabricated number.
