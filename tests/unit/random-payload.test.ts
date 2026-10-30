import { describe, expect, it } from "vitest";

describe("random payload chunking", () => {
  it("never requests more than 65536 entropy bytes at once", () => {
    const calls: number[] = [];
    const original = crypto.getRandomValues.bind(crypto) as <T extends ArrayBufferView>(
      array: T,
    ) => T;
    const cryptoAny = crypto as unknown as {
      getRandomValues: typeof crypto.getRandomValues;
    };
    cryptoAny.getRandomValues = ((arr: ArrayBufferView) => {
      calls.push(arr.byteLength);
      return original(arr);
    }) as typeof crypto.getRandomValues;

    const size = 524288;
    const payload = new Uint8Array(size);
    const maxChunk = 65536;
    for (let offset = 0; offset < size; offset += maxChunk) {
      const end = Math.min(offset + maxChunk, size);
      crypto.getRandomValues(payload.subarray(offset, end));
    }

    expect(payload.byteLength).toBe(size);
    expect(Math.max(...calls)).toBeLessThanOrEqual(65536);
    cryptoAny.getRandomValues = original;
  });
});
