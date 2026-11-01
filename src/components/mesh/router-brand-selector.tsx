"use client";

import { ROUTER_MANUFACTURERS, getRouterManufacturer } from "@/lib/mesh/router-admin";

export function RouterBrandSelector({
  manufacturerId,
  modelId,
  onManufacturerChange,
  onModelChange,
}: {
  manufacturerId: string;
  modelId: string;
  onManufacturerChange: (id: string) => void;
  onModelChange: (id: string) => void;
}) {
  const manufacturer = getRouterManufacturer(manufacturerId) ?? ROUTER_MANUFACTURERS[0];
  const field = "mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs font-medium text-foreground">
        Manufacturer
        <select
          className={field}
          value={manufacturer?.id}
          aria-label="Router manufacturer"
          onChange={(event) => onManufacturerChange(event.target.value)}
        >
          {ROUTER_MANUFACTURERS.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-medium text-foreground">
        Model
        <select
          className={field}
          value={modelId}
          aria-label="Router model"
          onChange={(event) => onModelChange(event.target.value)}
        >
          {manufacturer?.models.map((model) => (
            <option key={model.id} value={model.id}>{model.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
