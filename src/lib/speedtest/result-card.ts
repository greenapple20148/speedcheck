import type { ShareSummaryInput } from "@/lib/speedtest/run-state";

function line(label: string, value: number | null, unit: string, digits = 1): string {
  if (value == null) return `${label}  not measured`;
  return `${label}  ${value.toFixed(digits)} ${unit}`;
}

/** PNG of the result. The image has no IP address. */
export function downloadResultCard(input: ShareSummaryInput): void {
  if (typeof document === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(48, 48, 1104, 534, 24);
  ctx.fill();
  ctx.strokeStyle = "#E2E8F0";
  ctx.stroke();

  ctx.fillStyle = "#00866A";
  ctx.font = "600 28px Inter, sans-serif";
  ctx.fillText("MySpeedGauge", 88, 120);
  ctx.fillStyle = "#64748B";
  ctx.font = "400 22px Inter, sans-serif";
  const when = input.testedAt
    ? input.testedAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Unknown time";
  ctx.fillText(`${input.mode} · ${when}`, 88, 160);

  ctx.fillStyle = "#0F172A";
  ctx.font = "600 36px Inter, sans-serif";
  const rows = [
    line("Download", input.downloadMbps, "Mbps"),
    line("Upload", input.uploadMbps, "Mbps"),
    line("Latency", input.pingMs, "ms"),
    line("Jitter", input.jitterMs, "ms"),
  ];
  rows.forEach((row, index) => {
    ctx.fillText(row, 88, 240 + index * 64);
  });

  ctx.fillStyle = "#64748B";
  ctx.font = "400 22px Inter, sans-serif";
  ctx.fillText(input.serverName ? `Server  ${input.serverName}` : "Server  not named", 88, 520);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "myspeedgauge-result.png";
  link.click();
}
