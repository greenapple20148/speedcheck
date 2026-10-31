import { describe, expect, it } from "vitest";
import { isPrivateOrLoopbackIp } from "@/lib/network/ip";

describe("isPrivateOrLoopbackIp", () => {
  it("detects loopback and RFC1918", () => {
    expect(isPrivateOrLoopbackIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrLoopbackIp("10.0.0.5")).toBe(true);
    expect(isPrivateOrLoopbackIp("192.168.1.2")).toBe(true);
    expect(isPrivateOrLoopbackIp("8.8.8.8")).toBe(false);
  });
});
