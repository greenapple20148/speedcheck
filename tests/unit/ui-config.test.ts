import { describe, expect, it } from "vitest";
import {
  formatGaugeScaleLabel,
  jitterDescriptor,
  pingDescriptor,
  uploadDeltaCaption,
} from "@/lib/speedtest/ui-config";

describe("formatGaugeScaleLabel", () => {
  it("formats gbps and mbps labels", () => {
    expect(formatGaugeScaleLabel(2000)).toBe("2 Gbps");
    expect(formatGaugeScaleLabel(500)).toBe("500 Mbps");
  });
});

describe("metric captions", () => {
  it("describes ping and jitter", () => {
    expect(pingDescriptor(12)).toBe("Very low latency");
    expect(jitterDescriptor(3)).toBe("Very stable");
  });

  it("formats upload delta vs previous test", () => {
    expect(uploadDeltaCaption(110, 100)).toBe("+10% vs. last test");
    expect(uploadDeltaCaption(100, null)).toBeNull();
  });
});
