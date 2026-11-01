import { coverageFill } from "@/lib/mesh/coverage";
import { roomPoints } from "@/lib/mesh/geometry";
import type { CoverageCell, MeshFloor, MeshPlan, WifiBand } from "@/lib/mesh/types";

export function downloadJson(plan: MeshPlan): void {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mesh-plan.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function readFloorImage(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    throw new Error("pdf");
  }
  const allowed = file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/webp" || file.type.startsWith("image/");
  if (!allowed) throw new Error("type");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("unreadable"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("unreadable"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  const jpeg = canvas.toDataURL("image/jpeg", 0.72);
  if (jpeg.length > 500_000) throw new Error("large");
  return jpeg;
}

/** Local PNG of the current floor. The caption says the colors are an estimate. */
export async function downloadPlanPng(floor: MeshFloor, cells: CoverageCell[], band: WifiBand, opacity: number): Promise<void> {
  const width = 1200;
  const height = Math.max(1, Math.round((width * floor.heightFt) / Math.max(floor.widthFt, 1)));
  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = width * dpr;
  canvas.height = (height + 36) * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, width, height + 36);
  if (floor.imageDataUrl) {
    try {
      const image = await loadImage(floor.imageDataUrl);
      ctx.save();
      ctx.globalAlpha = floor.image?.opacity ?? 0.45;
      ctx.drawImage(image, 0, 0, width, height);
      ctx.restore();
    } catch {
      // The plan still exports without the picture.
    }
  }
  const toX = (feet: number) => (feet / floor.widthFt) * width;
  const toY = (feet: number) => (feet / floor.heightFt) * height;
  const visible = cells.filter((cell) => cell.inside !== false);
  if (floor.nodes.length > 0 && visible.length > 0) {
    ctx.save();
    const size = (2 / floor.widthFt) * width * 1.6;
    for (const cell of visible) {
      ctx.fillStyle = coverageFill(cell.score, opacity);
      ctx.fillRect(toX(cell.x) - size / 2, toY(cell.y) - size / 2, size, size);
    }
    ctx.restore();
  }
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1.5;
  for (const room of floor.rooms) {
    const points = roomPoints(room);
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = toX(point.x);
      const y = toY(point.y);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "#0F172A";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(room.name, toX(room.x + room.w / 2), toY(room.y + room.h / 2));
  }
  ctx.strokeStyle = "#1E293B";
  ctx.lineWidth = 3;
  for (const wall of floor.walls ?? []) {
    ctx.beginPath();
    ctx.moveTo(toX(wall.x1), toY(wall.y1));
    ctx.lineTo(toX(wall.x2), toY(wall.y2));
    ctx.stroke();
  }
  for (const node of floor.nodes) {
    ctx.beginPath();
    ctx.fillStyle = node.role === "primary" ? "#115E59" : "#14B8A6";
    ctx.arc(toX(node.x), toY(node.y), node.role === "primary" ? 10 : 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0F172A";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(node.name, toX(node.x), toY(node.y) - 14);
  }
  ctx.fillStyle = "#64748B";
  ctx.font = "13px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Estimated coverage · ${band} GHz · not a measured signal map`, 16, height + 22);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mesh-plan.png";
  link.click();
  URL.revokeObjectURL(url);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("unreadable"));
    image.src = src;
  });
}
