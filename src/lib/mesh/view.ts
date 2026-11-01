/** Camera math for the floor plan. Coordinates stay in feet. */

export interface PlanView {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function fitView(floorW: number, floorH: number, viewportAspect: number): PlanView {
  const safeW = floorW > 0 ? floorW : 1;
  const safeH = floorH > 0 ? floorH : 1;
  const aspect = viewportAspect > 0.2 && viewportAspect < 8 ? viewportAspect : safeW / safeH;
  const floorAspect = safeW / safeH;
  let width = safeW;
  let height = safeH;
  if (aspect > floorAspect) width = safeH * aspect;
  else height = safeW / aspect;
  width *= 1.08;
  height *= 1.08;
  return { x: (safeW - width) / 2, y: (safeH - height) / 2, width, height };
}

/** Zoom toward an anchor in floor feet. Factor above 1 zooms in. */
export function zoomView(view: PlanView, factor: number, anchorX: number, anchorY: number): PlanView {
  const safe = Number.isFinite(factor) && factor > 0 ? factor : 1;
  let width = view.width / safe;
  let height = view.height / safe;
  const minW = 4;
  const maxW = 800;
  if (width < minW) {
    const scale = minW / Math.max(width, 0.001);
    width = minW;
    height *= scale;
  } else if (width > maxW) {
    const scale = maxW / width;
    width = maxW;
    height *= scale;
  }
  const rx = view.width === 0 ? 0.5 : (anchorX - view.x) / view.width;
  const ry = view.height === 0 ? 0.5 : (anchorY - view.y) / view.height;
  return { x: anchorX - rx * width, y: anchorY - ry * height, width, height };
}

export function panBy(view: PlanView, dxFt: number, dyFt: number): PlanView {
  return { ...view, x: view.x + dxFt, y: view.y + dyFt };
}

/** Keep the center and vertical scale while matching a new viewport aspect. */
export function matchAspect(view: PlanView, viewportAspect: number): PlanView {
  if (!(viewportAspect > 0.2) || viewportAspect > 8) return view;
  const centerX = view.x + view.width / 2;
  const centerY = view.y + view.height / 2;
  const width = view.height * viewportAspect;
  return { x: centerX - width / 2, y: centerY - view.height / 2, width, height: view.height };
}

export function clientToViewFeet(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  view: PlanView,
): { x: number; y: number } {
  const width = rect.width || 1;
  const height = rect.height || 1;
  return {
    x: view.x + ((clientX - rect.left) / width) * view.width,
    y: view.y + ((clientY - rect.top) / height) * view.height,
  };
}

/** A readable scale-bar length in feet for the current view width. */
export function scaleBarFeet(viewWidthFt: number): number {
  const target = (viewWidthFt > 0 ? viewWidthFt : 40) / 8;
  const steps = [2, 4, 5, 8, 10, 20, 25, 50];
  let best = steps[0] ?? 8;
  for (const step of steps) {
    if (Math.abs(step - target) < Math.abs(best - target)) best = step;
  }
  return best;
}
