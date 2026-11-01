"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { Button } from "@/components/ui/button";
import { CalculatorInput, calculatorControlClass } from "@/components/ui/calculator-input";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSection } from "@/components/ui/form-section";
import { selectControlClass } from "@/components/ui/field";
import { SelectionCard } from "@/components/ui/selection-card";
import { WizardStepper } from "@/components/ui/wizard-stepper";
import { MESH_BRANDS } from "@/lib/mesh/catalog";
import { summarizeRoom } from "@/lib/mesh/measurements";
import { latestMeasuredResult, type MeasuredSpeedSnapshot } from "@/lib/mesh/router-wizard";
import { readHistory } from "@/lib/speedtest/history-store";
import type { Construction, MeshHome, MeshPlan } from "@/lib/mesh/types";
import { cn } from "@/lib/utils";

const STEPS = ["System", "Home", "Install", "Check"] as const;

const SETUP = [
  { id: "modem", label: "Connect the primary node to the modem or ONT with the cable from the quick start." },
  { id: "app", label: "Install the vendor app and create the network. Skip any step that the guide for your model does not show." },
  { id: "name", label: "Choose a network name. This site never asks for the Wi-Fi password." },
  { id: "pair", label: "Pair one satellite at a time, close to the primary node, then move it." },
  { id: "backhaul", label: "If a cable exists, use it only if the model guide says that port is for backhaul." },
  { id: "firmware", label: "Let the firmware update finish on every node before you judge the speed." },
  { id: "guest", label: "Add a guest network only after the main network is up." },
  { id: "devices", label: "Reconnect phones and laptops to the new name." },
];

const MONOGRAMS: Record<string, string> = {
  eero: "ee",
  "google-nest": "G",
  "tp-link-deco": "TP",
  "netgear-orbi": "NE",
  "asus-zenwifi": "AS",
  "linksys-velop": "L",
  generic: "…",
};

const CHECK_LINKS = [
  { href: "/speed-test", label: "Speed test beside the primary node" },
  { href: "/mesh-wifi/dead-zone-test", label: "Room-by-room test" },
  { href: "/mesh-wifi/planner", label: "Open the floor planner" },
  { href: "/bufferbloat-test", label: "Latency under load" },
];

interface HomeDraft {
  area: string;
  floors: string;
  devices: string;
  networkName: string;
}

export function SetupWizard() {
  const { plan, update, ready } = useMeshPlan();
  const [draft, setDraft] = useState<HomeDraft | null>(null);
  const [measured, setMeasured] = useState<MeasuredSpeedSnapshot | null | undefined>(undefined);

  useEffect(() => {
    if (!plan || draft) return;
    setDraft(draftFromHome(plan.home));
  }, [plan, draft]);

  useEffect(() => {
    try {
      setMeasured(latestMeasuredResult(readHistory()));
    } catch {
      setMeasured(null);
    }
  }, []);

  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;

  const step = plan.wizardStep;
  const homeDraft = draft ?? draftFromHome(plan.home);
  const brand = MESH_BRANDS.find((item) => item.slug === plan.home.brandSlug) ?? MESH_BRANDS[MESH_BRANDS.length - 1];
  const setHome = (patch: Partial<MeshHome>) => update({ ...plan, home: { ...plan.home, ...patch } });
  const go = (index: number) => update({ ...plan, wizardStep: Math.min(3, Math.max(0, index)) });

  function editDraft(patch: Partial<HomeDraft>) {
    const next = { ...homeDraft, ...patch };
    setDraft(next);
    const saved: Partial<MeshHome> = {};
    if ("area" in patch) {
      const area = parseBounded(next.area, 0, 20000, false);
      if (area != null) saved.area = area;
    }
    if ("floors" in patch) {
      const floors = parseBounded(next.floors, 1, 6, true);
      if (floors != null) saved.floors = floors;
    }
    if ("devices" in patch) {
      const devices = parseBounded(next.devices, 0, 500, true);
      if (devices != null) saved.devices = devices;
    }
    if ("networkName" in patch) saved.networkName = next.networkName.slice(0, 32);
    if (Object.keys(saved).length > 0) setHome(saved);
  }

  return (
    <div className="space-y-4">
      <WizardStepper steps={STEPS} current={step} onStep={go} />
      {step === 0 && (
        <FormSection
          id="mesh-system-heading"
          title="Which system are you installing?"
          description="Models from the same brand do not share one setup. Use the official guide for the model on the label."
        >
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="mesh-system-heading">
            {MESH_BRANDS.map((item) => (
              <SelectionCard
                key={item.slug}
                name="brand"
                value={item.slug}
                checked={plan.home.brandSlug === item.slug}
                title={item.name}
                monogram={MONOGRAMS[item.slug] ?? item.name.slice(0, 2)}
                onChange={() => setHome({ brandSlug: item.slug })}
              />
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">{brand.summary}</p>
          {brand.supportUrl ? (
            <p className="mt-3 text-sm">
              <a className="font-medium text-[#006B53] hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]" href={brand.supportUrl} rel="noopener noreferrer" target="_blank">
                Official {brand.name} support
              </a>
              <span className="text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground"> — reviewed {brand.reviewed}. Open the article for your model.</span>
            </p>
          ) : null}
          <p className="mt-2 text-sm text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">
            The <Link className="font-medium text-[#006B53] hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]" href="/router-setup">router setup guide</Link> also covers the login page, backhaul, and a speed test.
          </p>
        </FormSection>
      )}
      {step === 1 && (
        <FormSection
          id="mesh-home-heading"
          title="Tell us about the house"
          description="Home size is a planning input. It does not guarantee coverage, and this page does not scan the house."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CalculatorInput id="mesh-setup-area" label="Home size" error={boundError(homeDraft.area, 0, 20000, false, "Home size must be from 0 to 20,000.")}>
              <input
                id="mesh-setup-area"
                className={calculatorControlClass}
                inputMode="decimal"
                value={homeDraft.area}
                aria-invalid={boundError(homeDraft.area, 0, 20000, false, "x") ? true : undefined}
                aria-describedby={boundError(homeDraft.area, 0, 20000, false, "x") ? "mesh-setup-area-error" : undefined}
                onChange={(event) => editDraft({ area: event.target.value })}
              />
            </CalculatorInput>
            <div>
              <label htmlFor="mesh-setup-unit" className="text-sm font-medium">Unit</label>
              <select
                id="mesh-setup-unit"
                className={selectControlClass}
                value={plan.home.unit}
                onChange={(event) => setHome({ unit: event.target.value as MeshHome["unit"] })}
              >
                <option value="sqft">Square feet</option>
                <option value="sqm">Square meters</option>
              </select>
            </div>
            <CalculatorInput id="mesh-setup-floors" label="Floors" error={boundError(homeDraft.floors, 1, 6, true, "Floors must be a whole number from 1 to 6.")}>
              <input
                id="mesh-setup-floors"
                className={calculatorControlClass}
                inputMode="numeric"
                value={homeDraft.floors}
                aria-invalid={boundError(homeDraft.floors, 1, 6, true, "x") ? true : undefined}
                aria-describedby={boundError(homeDraft.floors, 1, 6, true, "x") ? "mesh-setup-floors-error" : undefined}
                onChange={(event) => editDraft({ floors: event.target.value })}
              />
            </CalculatorInput>
            <div>
              <label htmlFor="mesh-setup-construction" className="text-sm font-medium">Construction</label>
              <select
                id="mesh-setup-construction"
                className={selectControlClass}
                value={plan.home.construction}
                onChange={(event) => setHome({ construction: event.target.value as Construction })}
              >
                <option value="drywall">Drywall</option>
                <option value="wood">Wood</option>
                <option value="brick">Brick</option>
                <option value="concrete">Concrete</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <CalculatorInput
              id="mesh-setup-devices"
              label="Devices (approx.)"
              hint="A count you type. This page does not scan your network."
              error={boundError(homeDraft.devices, 0, 500, true, "Devices must be a whole number from 0 to 500.")}
            >
              <input
                id="mesh-setup-devices"
                className={calculatorControlClass}
                inputMode="numeric"
                value={homeDraft.devices}
                aria-invalid={boundError(homeDraft.devices, 0, 500, true, "x") ? true : undefined}
                aria-describedby={boundError(homeDraft.devices, 0, 500, true, "x") ? "mesh-setup-devices-error" : undefined}
                onChange={(event) => editDraft({ devices: event.target.value })}
              />
            </CalculatorInput>
            <CalculatorInput id="mesh-setup-network" label="Network name (optional)" hint="Stored on this device only. Not a password.">
              <input
                id="mesh-setup-network"
                className={calculatorControlClass}
                maxLength={32}
                placeholder="e.g., Home Wi-Fi"
                value={homeDraft.networkName}
                onChange={(event) => editDraft({ networkName: event.target.value })}
              />
            </CalculatorInput>
          </div>
        </FormSection>
      )}
      {step === 2 && (
        <FormSection
          id="mesh-install-heading"
          title="Installation checklist"
          description="Check a step after you do it. A mark is your confirmation. This site cannot see the app or the router, and it does not configure either one."
        >
          <p className="text-sm leading-6 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">
            If the ISP gateway and the mesh primary node both route traffic, you have double NAT. Bridge the gateway or put the mesh system in access-point mode. Change one of those, not both, and follow the model guide.
          </p>
          <ul className="mt-3 space-y-2">
            {SETUP.map((item) => {
              const checked = plan.checkedSetup.includes(item.id);
              return (
                <li key={item.id}>
                  <label className={cn(
                    "flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm leading-6",
                    checked
                      ? "border-[#009B78] bg-[#EAF8F1] [[data-theme=dark]_&]:border-[var(--accent-text)] [[data-theme=dark]_&]:bg-[var(--surface-subtle)]"
                      : "border-[#E2E8E5] [[data-theme=dark]_&]:border-border",
                  )}>
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 accent-[#006B53]"
                      checked={checked}
                      onChange={() => {
                        const next = checked
                          ? plan.checkedSetup.filter((id) => id !== item.id)
                          : [...plan.checkedSetup, item.id];
                        update({ ...plan, checkedSetup: next });
                      }}
                    />
                    <span>{item.label.replace("the vendor app", brand.appName)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {brand.supportUrl && (
            <p className="mt-3 text-sm">
              <a className="font-medium text-[#006B53] hover:underline [[data-theme=dark]_&]:text-[var(--accent-text)]" href={brand.supportUrl} rel="noopener noreferrer" target="_blank">
                Official {brand.name} support
              </a>
            </p>
          )}
        </FormSection>
      )}
      {step === 3 && (
        <CheckStep plan={plan} measured={measured} />
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={step === 0} onClick={() => go(step - 1)}>
          Back
        </Button>
        <Button type="button" disabled={step === 3} onClick={() => go(step + 1)}>
          Next
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

function CheckStep({
  plan,
  measured,
}: {
  plan: MeshPlan;
  measured: MeasuredSpeedSnapshot | null | undefined;
}) {
  const confirmed = SETUP.filter((item) => plan.checkedSetup.includes(item.id)).length;
  const roomIds = [...new Set(plan.measurements.map((sample) => sample.roomId))];
  const rooms = roomIds.flatMap((roomId) => {
    const summary = summarizeRoom(plan.measurements, roomId);
    return summary ? [{ ...summary, label: roomLabel(plan, roomId) }] : [];
  });
  const hasMeasurement = rooms.length > 0 || measured != null;

  return (
    <FormSection
      id="mesh-check-heading"
      title="Check what you confirmed"
      description="Checklist marks are yours. Speeds below come only from tests saved on this device. This page cannot read the router."
    >
      <p className="text-sm leading-6">
        You confirmed {confirmed} of {SETUP.length} install steps. A check is your confirmation, not a status from the router.
      </p>
      <div className="mt-4">
        {measured === undefined ? (
          <p className="text-sm text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">Checking saved tests on this device…</p>
        ) : !hasMeasurement ? (
          <EmptyState
            title="No measurement saved yet"
            body="Run a speed test or a room test when you are ready. This page does not invent a result."
          />
        ) : (
          <div className="space-y-3">
            {measured && (
              <div className="rounded-2xl border border-[#E2E8E5] bg-[#EAF8F1] p-3 text-sm [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-[var(--surface-subtle)]">
                <p className="font-semibold">Latest saved speed test</p>
                <p className="mt-1 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">
                  {speedBits(measured.downloadMbps, measured.uploadMbps, measured.pingMs)}
                  {measured.createdAt ? ` Saved ${formatWhen(measured.createdAt)}.` : ""}
                </p>
              </div>
            )}
            {rooms.length > 0 && (
              <ul className="space-y-2">
                {rooms.map((room) => (
                  <li key={room.roomId} className="rounded-2xl border border-[#E2E8E5] px-3 py-3 text-sm [[data-theme=dark]_&]:border-border">
                    <p className="font-semibold">{room.label}</p>
                    <p className="mt-1 text-[#64748B] [[data-theme=dark]_&]:text-muted-foreground">
                      Median of {room.sampleCount} saved room {room.sampleCount === 1 ? "test" : "tests"}. {speedBits(room.downloadMbps, room.uploadMbps, room.pingMs)}
                      {room.endpointName ? ` Server: ${room.endpointName}.` : ""} This is throughput, not signal strength.
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {CHECK_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex min-h-11 items-center rounded-xl border border-[#E2E8E5] bg-white px-3 text-sm font-semibold text-[#10231F] hover:border-[#009B78] [[data-theme=dark]_&]:border-border [[data-theme=dark]_&]:bg-card [[data-theme=dark]_&]:text-foreground"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </FormSection>
  );
}

function draftFromHome(home: MeshHome): HomeDraft {
  return {
    area: String(home.area),
    floors: String(home.floors),
    devices: String(home.devices),
    networkName: home.networkName,
  };
}

function parseBounded(raw: string, min: number, max: number, integer: boolean): number | null {
  const text = raw.trim();
  if (integer) {
    if (!/^\d+$/.test(text)) return null;
  } else if (!/^(?:\d+\.?\d*|\.\d+)$/.test(text)) {
    return null;
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  if (integer && !Number.isInteger(value)) return null;
  return value;
}

function boundError(raw: string, min: number, max: number, integer: boolean, message: string): string | null {
  if (raw.trim() === "") return message;
  return parseBounded(raw, min, max, integer) == null ? message : null;
}

function roomLabel(plan: MeshPlan, roomId: string): string {
  for (const floor of plan.floors) {
    const room = floor.rooms.find((item) => item.id === roomId);
    if (room) return `${floor.name}: ${room.name}`;
  }
  return "Saved room";
}

function speedBits(download: number | null, upload: number | null, ping: number | null): string {
  const parts = [
    download == null ? null : `Download ${formatMbps(download)}`,
    upload == null ? null : `Upload ${formatMbps(upload)}`,
    ping == null ? null : `Latency ${Math.round(ping)} ms`,
  ].filter((part): part is string => part != null);
  return parts.length > 0 ? parts.join(". ") + "." : "A test was saved without a speed figure.";
}

function formatMbps(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text} Mbps`;
}

function formatWhen(iso: string): string {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return "at an unknown time";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(time);
}
