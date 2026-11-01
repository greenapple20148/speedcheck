import { cn } from "@/lib/utils";

export function SelectionCard({
  name,
  value,
  checked,
  title,
  monogram,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  title: string;
  monogram: string;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "flex min-h-[4.5rem] min-w-0 cursor-pointer items-center gap-3 rounded-[20px] border bg-white p-3 text-[#10231F] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#006B53] [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground",
        checked
          ? "border-[#006B53] bg-[#EAF8F1] [[data-theme=dark]_&]:border-[var(--accent-text)] [[data-theme=dark]_&]:bg-[var(--surface-subtle)]"
          : "border-[#E2E8E5] [[data-theme=dark]_&]:border-border",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-[#006B53]"
      />
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#006B53] [[data-theme=dark]_&]:bg-[#134E4A]/50 [[data-theme=dark]_&]:text-[var(--accent-text)]"
      >
        {monogram}
      </span>
      <span className="min-w-0 text-sm font-semibold leading-5">{title}</span>
    </label>
  );
}
