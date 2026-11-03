/** Public GA4 measurement ID used when no override is configured. */
export const DEFAULT_GA_MEASUREMENT_ID = "G-DDDY9B4SBG";

/**
 * Measurement ID for the gtag.js tag.
 * A non-empty NEXT_PUBLIC_GA_MEASUREMENT_ID replaces the default.
 */
export function gaMeasurementId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return fromEnv || DEFAULT_GA_MEASUREMENT_ID;
}
