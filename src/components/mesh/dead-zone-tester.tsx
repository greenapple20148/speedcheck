"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { appendRoomSample, bestRoomDownload, roomSampleFromResult, summarizeRoom, throughputBand, type ThroughputBand } from "@/lib/mesh/measurements";
import { providerLabel } from "@/lib/network-health/snapshot";

const SpeedTestDashboard = dynamic(
  () => import("@/components/speedtest/dashboard/speed-test-dashboard").then((mod) => mod.SpeedTestDashboard),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading the speed test…</p> },
);

const BAND_FILL: Record<ThroughputBand, string> = {
  fast: "rgba(20, 200, 180, 0.55)",
  mid: "rgba(230, 162, 60, 0.45)",
  slow: "rgba(196, 86, 86, 0.4)",
  unmeasured: "transparent",
};

type RoomView = "download" | "latency" | "compare";

function latencyFill(pingMs: number | null): string {
  if (pingMs == null) return "transparent";
  if (pingMs < 30) return "rgba(20, 184, 166, 0.5)";
  if (pingMs < 80) return "rgba(251, 191, 36, 0.45)";
  return "rgba(248, 113, 113, 0.42)";
}

function formatNumber(value: number | null, unit: string): string {
  if (value == null) return "—";
  return `${Math.round(value * 10) / 10} ${unit}`;
}

export function DeadZoneTester() {
  const { plan, update, ready } = useMeshPlan();
  const [floorId, setFloorId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [view, setView] = useState<RoomView>("download");
  const planRef = useRef(plan);
  const roomRef = useRef(roomId);
  planRef.current = plan;
  roomRef.current = roomId;
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const activeFloor = plan.floors.find((floor) => floor.id === (floorId ?? plan.activeFloorId)) ?? plan.floors[0];
  const rooms = activeFloor ? activeFloor.rooms.map((room) => ({ ...room, floorName: activeFloor.name })) : [];
  const allRooms = plan.floors.flatMap((floor) => floor.rooms.map((room) => ({ ...room, floorName: floor.name })));
  const best = bestRoomDownload(plan.measurements);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick a floor and a room, run the test while you are standing in that room, then move to the next room. Nothing runs until you press Start. Each finished test is saved on this device. The number shown for a room is the median of its saved samples. A low speed is throughput to the test server. It is not a Wi-Fi signal reading, and this browser cannot see which mesh node you are connected to.
      </p>
      {allRooms.length === 0 ? (
        <p className="text-sm">Add rooms in the <a className="font-medium text-primary" href="/mesh-wifi/planner">floor planner</a> first.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Floor
            <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={activeFloor?.id ?? ""} onChange={(event) => { setFloorId(event.target.value); setRoomId(null); }}>
              {plan.floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Room
            <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={roomId ?? ""} onChange={(event) => setRoomId(event.target.value || null)}>
              <option value="">Select a room</option>
              {rooms.map((room) => <option key={room.id} value={room.id}>{room.name}</option>)}
            </select>
          </label>
        </div>
      )}
      <p className="text-sm text-muted-foreground">This uses the standard test so loaded latency can be recorded when the test measures it.</p>
      <SpeedTestDashboard
        defaultMode="standard"
        onComplete={(result) => {
          const latest = planRef.current;
          const selectedRoom = roomRef.current;
          if (!latest || !selectedRoom) return;
          update({
            ...latest,
            measurements: appendRoomSample(latest.measurements, roomSampleFromResult(selectedRoom, result)),
          });
        }}
      />
      {!roomId && <p className="text-sm text-muted-foreground">Select a room before you start if you want the result saved to the plan.</p>}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Room result view">
        {([
          ["download", "Measured download"],
          ["latency", "Measured latency"],
          ["compare", "Room comparison"],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" className={`min-h-11 rounded-lg border px-3 text-sm ${view === id ? "border-primary text-primary" : "border-border"}`} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>
        ))}
        <a className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm" href="/mesh-wifi/planner">Estimated coverage</a>
      </div>
      <p className="text-xs text-muted-foreground">Estimated coverage is the planner’s distance and wall model. It is not calculated from these speed tests.</p>
      {view !== "compare" && activeFloor && (
        <section aria-label={view === "download" ? "Measured download by room" : "Measured latency by room"}>
          {activeFloor.rooms.length === 0 ? <p className="text-sm text-muted-foreground">No rooms on this floor.</p> : (
            <svg viewBox={`0 0 ${activeFloor.widthFt} ${activeFloor.heightFt}`} role="img" aria-label={`${activeFloor.name} ${view === "download" ? "median download" : "median latency"}`} className="mt-2 h-auto w-full rounded-xl border border-border bg-[var(--surface-subtle)]">
              {activeFloor.rooms.map((room) => {
                const summary = summarizeRoom(plan.measurements, room.id);
                const fill = view === "download" ? BAND_FILL[throughputBand(summary?.downloadMbps, best)] : latencyFill(summary?.pingMs ?? null);
                return (
                  <g key={room.id}>
                    <rect x={room.x} y={room.y} width={room.w} height={room.h} fill={fill} stroke="currentColor" strokeWidth={0.15} />
                    <text x={room.x + 0.4} y={room.y + 1.6} fontSize={1.2} fill="currentColor">{room.name}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </section>
      )}
      <section aria-label="Room comparison">
        <h2 className="text-sm font-semibold">Room comparison</h2>
        <p className="mt-1 text-sm text-muted-foreground">Medians of the samples saved for each room. A blank row has no saved test.</p>
        <ul className="mt-3 space-y-2">
          {allRooms.map((room) => {
            const summary = summarizeRoom(plan.measurements, room.id);
            return (
              <li key={room.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                <p className="font-medium">{room.floorName}: {room.name}</p>
                {summary ? (
                  <p className="text-muted-foreground">
                    Median of {summary.sampleCount} {summary.sampleCount === 1 ? "test" : "tests"}. Download {formatNumber(summary.downloadMbps, "Mbps")}, upload {formatNumber(summary.uploadMbps, "Mbps")}, latency {formatNumber(summary.pingMs, "ms")}, jitter {formatNumber(summary.jitterMs, "ms")}, loaded latency {formatNumber(summary.loadedLatencyMs, "ms")}. {summary.mixedProvider ? "More than one measurement provider." : `Provider: ${providerLabel(summary.provider ?? null)}.`} {summary.endpointName ?? "Endpoint not named"}. Latest {new Date(summary.testedAt).toLocaleString()}.
                  </p>
                ) : (
                  <p className="text-muted-foreground">No measurement saved for this room.</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
