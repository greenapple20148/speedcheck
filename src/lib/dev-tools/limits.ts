/** Practical ceiling for pasted text and local files in the developer tools. */
export const MAX_INPUT_BYTES = 1_500_000;

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function sizeError(value: string, label = "Input"): string | null {
  if (byteLength(value) > MAX_INPUT_BYTES) {
    return `${label} is larger than 1.5 MB. Use a smaller document.`;
  }
  return null;
}
