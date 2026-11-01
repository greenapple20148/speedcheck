/** Fallback map when Google Maps is unavailable (no API key or dev server). */
export function StylizedServerMap({ label }: { label: string }) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-[var(--speed-map-bg)]">
      <svg
        viewBox="0 0 400 280"
        className="h-full w-full text-muted-foreground/35"
        aria-hidden
      >
        <path fill="currentColor" d="M40 40h320v200H40z" opacity={0.15} />
        <path
          fill="currentColor"
          d="M80 60c40-20 120-25 180-10 50 12 80 40 90 80 5 25-10 50-40 65-35 18-95 20-140 5-45-15-75-50-90-90-8-22-5-45 0-50z"
          opacity={0.35}
        />
        <circle cx="268" cy="118" r="6" fill="#f38020" opacity={0.9} />
        <circle
          cx="268"
          cy="118"
          r="14"
          fill="none"
          stroke="#f38020"
          strokeWidth={2}
          opacity={0.5}
        />
      </svg>
      <p className="absolute bottom-2 left-2 right-2 truncate text-[11px] font-medium text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
