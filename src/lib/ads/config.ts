/** Ads stay off unless a public flag and a publisher id are both set. */
export function adsRequested(): boolean {
  return (
    process.env.NEXT_PUBLIC_ADS_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_ADS === "true"
  );
}

export function adsActive(): boolean {
  return adsRequested() && Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);
}
