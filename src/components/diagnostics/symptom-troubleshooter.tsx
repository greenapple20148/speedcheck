"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  troubleshoot,
  type MeasurementSnapshot,
  type Symptom,
} from "@/lib/network/diagnosis";
import { latencyIncreaseMs } from "@/lib/network/loaded-latency";
import { readHistory } from "@/lib/speedtest/history-store";
import { trackEvent } from "@/lib/analytics/events";

const SYMPTOMS: { id: Symptom; label: string }[] = [
  { id: "slow", label: "Internet is slow" },
  { id: "wifi-drops", label: "Wi-Fi keeps disconnecting" },
  { id: "gaming-lag", label: "Gaming lag" },
  { id: "video-freeze", label: "Video calls freezing" },
  { id: "streaming-buffer", label: "Streaming buffering" },
  { id: "slow-upload", label: "Uploads are slow" },
  { id: "high-ping", label: "High ping" },
  { id: "slow-at-night", label: "Internet slower at night" },
];

export function SymptomTroubleshooter({
  initialSymptoms = [],
}: {
  initialSymptoms?: Symptom[];
}) {
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialSymptoms);
  const [link, setLink] = useState<"wifi" | "ethernet" | "unknown">("unknown");
  const [device, setDevice] = useState<"phone" | "computer" | "tv" | "console" | "unknown">("unknown");
  const [advertised, setAdvertised] = useState("");
  const [devices, setDevices] = useState("");
  const [multi, setMulti] = useState<"unknown" | "yes" | "no">("unknown");
  const [pattern, setPattern] = useState<"continuous" | "intermittent" | "unknown">("unknown");
  const [ran, setRan] = useState(false);

  const measurement = useMemo<MeasurementSnapshot | null>(() => {
    const latest = readHistory()[0];
    if (!latest) return null;
    const loaded =
      latest.bufferbloatLoadedDownMs != null || latest.bufferbloatLoadedUpMs != null
        ? Math.max(latest.bufferbloatLoadedDownMs ?? 0, latest.bufferbloatLoadedUpMs ?? 0)
        : null;
    return {
      downloadMbps: latest.downloadMbps,
      uploadMbps: latest.uploadMbps,
      pingMs: latest.pingMs,
      jitterMs: latest.jitterMs,
      loadedLatencyIncreaseMs: latencyIncreaseMs(latest.bufferbloatIdleMs ?? latest.pingMs, loaded),
      endpointId: latest.serverName ?? null,
    };
  }, [ran]);

  const result = ran
    ? troubleshoot(
        {
          symptoms,
          link,
          device,
          advertisedDownloadMbps: advertised.trim() === "" ? null : Number(advertised),
          connectedDevices: devices.trim() === "" ? null : Number(devices),
          affectsMultipleDevices: multi === "unknown" ? null : multi === "yes",
          pattern,
        },
        measurement,
      )
    : null;

  const toggle = (id: Symptom) => {
    setSymptoms((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <form
      className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setRan(true);
        trackEvent("troubleshooting_started", { symptoms: symptoms.length });
        trackEvent("troubleshooting_completed", { symptoms: symptoms.length });
      }}
    >
      <fieldset>
        <legend className="text-sm font-semibold text-foreground">What is going wrong?</legend>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SYMPTOMS.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm">
                <input
                  type="checkbox"
                  checked={symptoms.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />
                {item.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Connection
          <select
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={link}
            onChange={(event) => setLink(event.target.value as typeof link)}
          >
            <option value="unknown">Not sure</option>
            <option value="wifi">Wi-Fi</option>
            <option value="ethernet">Ethernet</option>
          </select>
        </label>
        <label className="text-sm">
          Device
          <select
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={device}
            onChange={(event) => setDevice(event.target.value as typeof device)}
          >
            <option value="unknown">Not sure</option>
            <option value="computer">Computer</option>
            <option value="phone">Phone</option>
            <option value="tv">TV</option>
            <option value="console">Game console</option>
          </select>
        </label>
        <label className="text-sm">
          Advertised download (Mbps)
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            inputMode="decimal"
            value={advertised}
            onChange={(event) => setAdvertised(event.target.value)}
          />
        </label>
        <label className="text-sm">
          Connected devices
          <input
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            inputMode="numeric"
            value={devices}
            onChange={(event) => setDevices(event.target.value)}
          />
        </label>
        <label className="text-sm">
          More than one device affected?
          <select
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={multi}
            onChange={(event) => setMulti(event.target.value as typeof multi)}
          >
            <option value="unknown">Not sure</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="text-sm">
          Pattern
          <select
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2"
            value={pattern}
            onChange={(event) => setPattern(event.target.value as typeof pattern)}
          >
            <option value="unknown">Not sure</option>
            <option value="continuous">Continuous</option>
            <option value="intermittent">Comes and goes</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Show checks
      </button>
      {result && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Diagnosis</h2>
          <p className="text-sm leading-6 text-foreground">{result.diagnosis}</p>
          {result.measuredNotes.length > 0 && (
            <p className="text-sm text-muted-foreground">Using saved measurements: {result.measuredNotes.join(" · ")}</p>
          )}
          {result.missing.length > 0 && (
            <p className="text-sm text-muted-foreground">Not measured here: {result.missing.join(", ")}.</p>
          )}
          <ol className="space-y-3">
            {result.recommendations.map((item, index) => (
              <li key={item.id} className="rounded-xl bg-muted p-4 text-sm">
                <p className="font-semibold text-foreground">
                  {index + 1}. {item.title}
                </p>
                <p className="mt-1 text-muted-foreground">Why: {item.why}</p>
                <p className="mt-1 text-muted-foreground">Test it: {item.howToTest}</p>
                <p className="mt-1 text-muted-foreground">Look for: {item.expectedImprovement}</p>
                <p className="mt-1 text-muted-foreground">Confidence: {item.confidence}</p>
                {item.guideHref && item.guideLabel && (
                  <Link href={item.guideHref} className="mt-2 inline-block font-medium text-primary hover:underline">
                    {item.guideLabel}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </form>
  );
}
