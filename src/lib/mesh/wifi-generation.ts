export interface WifiAdvice {
  title: string;
  why: string;
}

/** Suggest a generation from what the household actually uses. Newest is not the default. */
export function suggestWifiGeneration(input: {
  wifi7Devices: boolean;
  needs6GHz: boolean;
  manyDevices: boolean;
}): WifiAdvice {
  if (input.wifi7Devices) {
    return {
      title: "Wi-Fi 7 is worth it only for the devices that can use it",
      why: "A Wi-Fi 7 mesh helps clients that speak Wi-Fi 7. Older phones still fall back to Wi-Fi 6 or 5. Buy it for those new devices, not for a larger number on the box.",
    };
  }
  if (input.needs6GHz) {
    return {
      title: "Wi-Fi 6E is the generation that adds 6 GHz",
      why: "6 GHz is less crowded when both the mesh node and the client support it. It does not travel as far through walls as 2.4 GHz, so placement still matters.",
    };
  }
  if (input.manyDevices) {
    return {
      title: "Wi-Fi 6 is the practical default for a busy home",
      why: "It handles more devices more calmly than Wi-Fi 5. A Wi-Fi 7 kit does not raise the speed of a Wi-Fi 5 laptop.",
    };
  }
  return {
    title: "Wi-Fi 6 is enough for most homes that do not have 6 GHz clients",
    why: "Replace a Wi-Fi 5 router when the wired test is fine and rooms stay slow after you move the node. Skip Wi-Fi 7 until you own devices that can use it.",
  };
}
