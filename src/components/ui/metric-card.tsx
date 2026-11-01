export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E2E8E5] bg-white p-3 [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card">
      <p className="text-xs text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tabular-nums text-[#10231F] [[data-theme=dark]_&]:text-foreground">
        {value}
      </p>
    </div>
  );
}
