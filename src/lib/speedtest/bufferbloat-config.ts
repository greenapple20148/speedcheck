/** Loaded latency uses the median of samples taken ~200ms apart during transfer. */

export type BufferbloatGrade = "A" | "B" | "C" | "D" | "F";

export const BUFFERBLOAT_GRADE_THRESHOLDS_MS = [
  { grade: "A" as const, maxIncrease: 5 },
  { grade: "B" as const, maxIncrease: 30 },
  { grade: "C" as const, maxIncrease: 60 },
  { grade: "D" as const, maxIncrease: 200 },
] as const;

export function gradeFromLatencyIncrease(increaseMs: number): BufferbloatGrade {
  if (increaseMs < 5) return "A";
  if (increaseMs < 30) return "B";
  if (increaseMs < 60) return "C";
  if (increaseMs < 200) return "D";
  return "F";
}

export const BUFFERBLOAT_GRADE_LABEL: Record<BufferbloatGrade, string> = {
  A: "Excellent under load",
  B: "Good under load",
  C: "Fair under load",
  D: "Poor under load",
  F: "Very poor under load",
};

/** One-line headline shown under the letter grade. */
export const BUFFERBLOAT_GRADE_SUMMARY: Record<BufferbloatGrade, string> = {
  A: "Your connection stays responsive under load",
  B: "Latency rises slightly under load but stays usable",
  C: "You may notice lag on calls or games when the line is busy",
  D: "Expect noticeable lag when downloading or uploading",
  F: "Heavy lag under load — video calls and gaming will suffer",
};
