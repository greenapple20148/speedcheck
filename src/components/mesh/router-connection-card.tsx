"use client";

import { useMemo, useState } from "react";
import {
  gatewaySuggestionsFor,
  getRouterManufacturer,
  parseGatewayAddress,
  ROUTER_MANUFACTURERS,
} from "@/lib/mesh/router-admin";
import { GatewayAddressInput } from "./gateway-address-input";
import { RouterBrandSelector } from "./router-brand-selector";
import { RouterConnectionHelp } from "./router-connection-help";
import { RouterLoginGuide } from "./router-login-guide";

export function RouterConnectionCard() {
  const [manufacturerId, setManufacturerId] = useState(ROUTER_MANUFACTURERS[0]?.id ?? "other");
  const [modelId, setModelId] = useState(ROUTER_MANUFACTURERS[0]?.models[0]?.id ?? "other");
  const [address, setAddress] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [opened, setOpened] = useState(false);

  const manufacturer = getRouterManufacturer(manufacturerId) ?? ROUTER_MANUFACTURERS[ROUTER_MANUFACTURERS.length - 1];
  const model = manufacturer?.models.find((item) => item.id === modelId) ?? manufacturer?.models[0];
  const appOnly = manufacturer?.management === "app";
  const suggestions = useMemo(() => gatewaySuggestionsFor(manufacturerId), [manufacturerId]);
  const parsed = address.trim() ? parseGatewayAddress(address) : null;
  const adminUrl = !appOnly && parsed?.ok ? parsed.url : null;

  const chooseManufacturer = (id: string) => {
    const next = getRouterManufacturer(id);
    setManufacturerId(id);
    setModelId(next?.models[0]?.id ?? "other");
    setConfirmed(false);
    setOpened(false);
  };

  return (
    <div className="space-y-4 text-foreground">
      <RouterBrandSelector
        manufacturerId={manufacturerId}
        modelId={modelId}
        onManufacturerChange={chooseManufacturer}
        onModelChange={(id) => {
          setModelId(id);
          setOpened(false);
        }}
      />
      <p className="text-sm text-foreground">Selected model: {model?.label}. Use the steps for the model printed on the unit.</p>
      <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
        {manufacturer?.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {manufacturer?.supportUrl && (
        <a className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" href={manufacturer.supportUrl} target="_blank" rel="noopener noreferrer">
          Official {manufacturer.name} support
        </a>
      )}
      {appOnly ? (
        <p className="rounded-xl border border-border bg-[var(--surface-subtle)] px-3 py-2 text-sm text-foreground">
          Opening a browser tab would not sign you in. Use the {manufacturer?.appName} while this phone or computer is on that Wi-Fi.
        </p>
      ) : (
        <>
          <GatewayAddressInput
            value={address}
            suggestions={suggestions}
            error={parsed && !parsed.ok ? parsed.error : null}
            warning={parsed?.ok && !parsed.typicalLocalGateway ? "This is a valid address, and it is outside the usual private gateway ranges. Confirm it before opening." : null}
            onChange={(value) => {
              setAddress(value);
              setConfirmed(false);
              setOpened(false);
            }}
          />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmed}
              disabled={!adminUrl}
              onChange={(event) => {
                setConfirmed(event.target.checked);
                setOpened(false);
              }}
            />
            <span>Open this address in a new tab. MySpeedGauge is not connecting to the router and will not ask for its password.</span>
          </label>
          {adminUrl && confirmed ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              onClick={() => {
                window.open(adminUrl, "_blank", "noopener,noreferrer");
                setOpened(true);
              }}
            >
              Open admin page
            </button>
          ) : (
            <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground opacity-50" disabled>
              Open admin page
            </button>
          )}
          {adminUrl && confirmed && (
            <p className="break-all text-xs text-muted-foreground">The tab will open {adminUrl}</p>
          )}
        </>
      )}
      <RouterLoginGuide />
      <RouterConnectionHelp opened={opened} appOnly={Boolean(appOnly)} />
    </div>
  );
}
