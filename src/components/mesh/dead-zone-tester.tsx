"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useMeshPlan } from "@/components/mesh/use-mesh-plan";
import { bestDownloadMbps, throughputBand, type ThroughputBand } from "@/lib/mesh/measurements";

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

export function DeadZoneTester() {
  const { plan, update, ready } = useMeshPlan();
  const [roomId, setRoomId] = useState<string | null>(null);
  const planRef = useRef(plan);
  const roomRef = useRef(roomId);
  planRef.current = plan;
  roomRef.current = roomId;
  if (!ready || !plan) return <p className="text-sm text-muted-foreground">Loading your saved plan…</p>;
  const rooms = plan.floors.flatMap((floor) => floor.rooms.map((room) => ({ ...room, floorName: floor.name })));
  const selected = rooms.find((room) => room.id === roomId) ?? null;
  const best = bestDownloadMbps(plan.measurements);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick a room, run the test while you are standing in that room, then save it. Nothing runs until you press Start. A low speed is throughput to the test server. It is not a Wi-Fi signal reading, and this browser cannot see which mesh node you are connected to.
      </p>
      {rooms.length === 0 ? (
        <p className="text-sm">Add rooms in the <a className="font-medium text-primary" href="/mesh-wifi/planner">floor planner</a> first.</p>
      ) : (
        <label className="block text-sm">Room
          <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2" value={roomId ?? ""} onChange={(event) => setRoomId(event.target.value || null)}>
            <option value="">Select a room</option>
            {rooms.map((room) => <option key={room.id} value={room.id}>{room.floorName}: {room.name}</option>)}
          </select>
        </label>
      )}
      <SpeedTestDashboard
        defaultMode="lightweight"
        onComplete={(result) => {
          const latest = planRef.current;
          const selectedRoom = roomRef.current;
          if (!latest || !selectedRoom) return;
          update({
            ...latest,
            measurements: [
              {
                roomId: selectedRoom,
                downloadMbps: result.metrics.downloadMbps,
                uploadMbps: result.metrics.uploadMbps,
                pingMs: result.metrics.pingMs,
                jitterMs: result.metrics.jitterMs,
                testedAt: result.testedAt,
                endpointName: result.serverName,
              },
              ...latest.measurements.filter((row) => row.roomId !== selectedRoom),
            ],
          });
        }}
      />
      {!selected && <p className="text-sm text-muted-foreground">Select a room before you start if you want the result saved to the plan.</p>}
      <section aria-label="Measured throughput by room">
        <p className="text-sm text-muted-foreground">Measured throughput, not signal strength. A blank room has no saved test. A slower room is not labeled a dead zone.</p>
        {plan.floors.map((floor) => (
          <div key={floor.id} className="mt-3">
            <h2 className="text-sm font-semibold">{floor.name}</h2>
            {floor.rooms.length === 0 ? <p className="text-sm text-muted-foreground">No rooms on this floor.</p> : (
              <svg viewBox={`0 0 ${floor.widthFt} ${floor.heightFt}`} role="img" aria-label={`${floor.name} measured throughput`} className="mt-2 h-auto w-full rounded-xl border border-border bg-[var(--surface-subtle)]">
                {floor.rooms.map((room) => {
                  const sample = plan.measurements.find((row) => row.roomId === room.id);
                  const band = throughputBand(sample?.downloadMbps, best);
                  return (
                    <g key={room.id}>
                      <rect x={room.x} y={room.y} width={room.w} height={room.h} fill={BAND_FILL[band]} stroke="currentColor" strokeWidth={0.15} />
                      <text x={room.x + 0.4} y={room.y + 1.6} fontSize={1.2} fill="currentColor">{room.name}</text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        ))}
      </section>
      <ul className="space-y-2">
        {rooms.map((room) => {
          const sample = plan.measurements.find((row) => row.roomId === room.id);
          return (
            <li key={room.id} className="rounded-xl border border-border px-3 py-2 text-sm">
              <p className="font-medium">{room.floorName}: {room.name}</p>
              {sample ? (
                <p className="text-muted-foreground">
                  Download {sample.downloadMbps ?? "—"} Mbps, upload {sample.uploadMbps ?? "—"} Mbps, latency {sample.pingMs ?? "—"} ms, jitter {sample.jitterMs ?? "—"} ms. {sample.endpointName ?? "Endpoint not named"}. {new Date(sample.testedAt).toLocaleString()}.
                </p>
              ) : (
                <p className="text-muted-foreground">No measurement saved for this room.</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
