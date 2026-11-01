/** Mean absolute difference between successive valid RTT samples. */
export function jitterFromSamples(samples: number[]): number | null {
  if (samples.length < 2) return null;
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    total += Math.abs(samples[i] - samples[i - 1]);
  }
  return total / (samples.length - 1);
}
