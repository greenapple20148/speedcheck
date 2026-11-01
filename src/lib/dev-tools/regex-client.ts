import { executeRegex, REGEX_LIMITS, regexInputError, settleRegexRun, type RegexResult } from "@/lib/dev-tools/regex";

type RegexJob = {
  pattern?: string;
  flags?: string;
  text?: string;
  replacement?: string;
};

/** The worker source is the same executeRegex function, so the limits cannot drift. */
export function runRegexInWorker(input: RegexJob, timeoutMs = REGEX_LIMITS.timeoutMs): Promise<RegexResult> {
  const blocked = regexInputError(input);
  if (blocked) return Promise.resolve({ ok: false, code: "limit", error: blocked });
  if (typeof Worker === "undefined" || typeof Blob === "undefined") {
    return Promise.resolve({
      ok: false,
      code: "limit",
      error: "This browser cannot run a pattern in a background thread.",
    });
  }
  return new Promise((resolve) => {
    const source = `const executeRegex = ${executeRegex.toString()};
self.onmessage = function (event) {
  try {
    self.postMessage(executeRegex(event.data));
  } catch (error) {
    self.postMessage({ ok: false, code: "syntax", error: error && error.message ? error.message : "The pattern could not be run." });
  }
};`;
    const blob = new Blob([source], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const started = Date.now();
    let settled = false;
    const finish = (result: RegexResult) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };
    const timer = window.setTimeout(() => {
      finish(settleRegexRun(timeoutMs + 1, timeoutMs, null));
    }, timeoutMs);
    worker.onmessage = (event: MessageEvent<RegexResult>) => {
      const elapsed = Date.now() - started;
      const data = event.data;
      if (!data || typeof data !== "object" || !("ok" in data)) {
        finish({ ok: false, code: "syntax", error: "The pattern could not be run." });
        return;
      }
      finish(settleRegexRun(elapsed, timeoutMs, data));
    };
    worker.onerror = () => {
      finish({ ok: false, code: "syntax", error: "The pattern could not be run." });
    };
    worker.postMessage({
      pattern: input.pattern ?? "",
      flags: input.flags ?? "",
      text: input.text ?? "",
      replacement: input.replacement,
    });
  });
}
