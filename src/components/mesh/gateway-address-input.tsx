"use client";

export function GatewayAddressInput({
  value,
  suggestions,
  error,
  warning,
  onChange,
}: {
  value: string;
  suggestions: string[];
  error: string | null;
  warning: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-foreground" htmlFor="router-gateway-address">
        Gateway address
      </label>
      <input
        id="router-gateway-address"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        value={value}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        inputMode="url"
        placeholder="192.168.1.1"
        aria-invalid={error ? true : undefined}
        aria-describedby="router-gateway-help"
        onChange={(event) => onChange(event.target.value)}
      />
      <p id="router-gateway-help" className="text-xs text-muted-foreground">
        Use the address from your router label or from the gateway steps below. You can edit any suggestion.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="min-h-11 rounded-full border border-border px-3 text-xs"
            onClick={() => onChange(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {warning && <p className="text-xs text-muted-foreground">{warning}</p>}
    </div>
  );
}
