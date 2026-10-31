import path from "path";

/** Vercel/Lambda cwd is read-only; only /tmp is writable. */
export function isServerlessRuntime(): boolean {
  if (process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return true;
  }
  return process.cwd().startsWith("/var/task");
}

export function resolveResultsStorePath(): string {
  const configured = process.env.RESULTS_STORE_PATH?.trim();
  if (configured) return configured;
  if (isServerlessRuntime()) {
    return path.join("/tmp", "speedcheck", "results.json");
  }
  return path.join(process.cwd(), ".data", "results.json");
}
