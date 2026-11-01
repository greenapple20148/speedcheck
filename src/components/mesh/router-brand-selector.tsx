"use client";

import { selectControlClass } from "@/components/ui/field";
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

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs font-medium text-foreground">
        Manufacturer
        <select
          className={selectControlClass}
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
          className={selectControlClass}
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
