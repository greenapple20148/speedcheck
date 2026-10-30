import { describe, expect, it, vi } from "vitest";
import { withTimeout } from "@/lib/speedtest/fetch-timeout";

describe("withTimeout", () => {
  it("aborts after timeout", async () => {
    vi.useFakeTimers();
    const { signal, cleanup } = withTimeout(undefined, 100);
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(100);
    expect(signal.aborted).toBe(true);
    cleanup();
    vi.useRealTimers();
  });

  it("propagates parent abort", () => {
    const parent = new AbortController();
    const { signal, cleanup } = withTimeout(parent.signal, 10_000);
    parent.abort();
    expect(signal.aborted).toBe(true);
    cleanup();
  });
});
