import { cn } from "@/lib/utils";

export function PresetSelector<T extends string>({
  labelId,
  label,
  hint,
  value,
  options,
  onSelect,
}: {
  labelId: string;
  label: string;
  hint?: string;
  value: T;
  options: Array<{ id: T; label: string; detail?: string }>;
  onSelect: (id: T) => void;
}) {
  return (
    <div>
      <p id={labelId} className="text-sm font-medium text-[#10231F] [[data-theme=dark]_&]:text-foreground">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby={labelId}>
        {options.map((option) => {
          const active = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.id)}
              className={cn(
                "max-w-full rounded-full border px-3 py-1.5 text-left text-xs font-semibold",
                active
                  ? "border-[#006B53] bg-[#006B53] text-white"
                  : "border-[#E2E8E5] bg-white text-[#10231F] hover:border-[#009B78] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground",
              )}
            >
              {option.detail ? `${option.label} ${option.detail}` : option.label}
            </button>
          );
        })}
      </div>
      {hint ? <p className="mt-2 text-xs text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
