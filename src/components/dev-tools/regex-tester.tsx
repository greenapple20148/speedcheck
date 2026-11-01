"use client";

import { useState } from "react";
import {
  Alert,
  Editor,
  OutputFrame,
  StatusBar,
  Toolbar,
  ToolButton,
  Workspace,
  trackTool,
} from "@/components/dev-tools/chrome";
import { REGEX_LIMITS, type RegexResult } from "@/lib/dev-tools/regex";
import { runRegexInWorker } from "@/lib/dev-tools/regex-client";

const EXAMPLES = [
  { label: "Words", pattern: "\\b\\w+\\b", flags: "g", text: "format JSON online", replacement: "" },
  { label: "Groups", pattern: "h(el)lo", flags: "g", text: "hello hello", replacement: "hi" },
  { label: "Date", pattern: "(\\d{4})-(\\d{2})-(\\d{2})", flags: "", text: "2023-11-14", replacement: "$2/$3/$1" },
];

export function RegexTesterTool() {
  const [pattern, setPattern] = useState(EXAMPLES[1].pattern);
  const [flags, setFlags] = useState(EXAMPLES[1].flags);
  const [text, setText] = useState(EXAMPLES[1].text);
  const [replacement, setReplacement] = useState(EXAMPLES[1].replacement);
  const [result, setResult] = useState<RegexResult | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    trackTool("regex-tester", "match");
    setRunning(true);
    const next = await runRegexInWorker({ pattern, flags, text, replacement: replacement === "" ? undefined : replacement });
    setResult(next);
    setRunning(false);
  }

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        The pattern runs in a background thread and stops after {REGEX_LIMITS.timeoutMs} ms. Patterns are limited to {REGEX_LIMITS.maxPatternLength} characters and test text to {REGEX_LIMITS.maxTextLength.toLocaleString("en-US")} characters.
      </p>
      <Toolbar>
        <ToolButton onClick={() => void run()} disabled={running}>
          {running ? "Running" : "Run"}
        </ToolButton>
        {EXAMPLES.map((example) => (
          <ToolButton
            key={example.label}
            tone="ghost"
            onClick={() => {
              setPattern(example.pattern);
              setFlags(example.flags);
              setText(example.text);
              setReplacement(example.replacement);
              setResult(null);
              trackTool("regex-tester", "example");
            }}
          >
            {example.label}
          </ToolButton>
        ))}
      </Toolbar>
      <div className="grid gap-3 md:grid-cols-[1fr_8rem]">
        <label className="text-sm text-[var(--dt-muted)]">
          Pattern
          <input
            value={pattern}
            onChange={(event) => setPattern(event.target.value)}
            className="dt-mono mt-1 h-11 w-full rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
            spellCheck={false}
          />
        </label>
        <label className="text-sm text-[var(--dt-muted)]">
          Flags
          <input
            value={flags}
            onChange={(event) => setFlags(event.target.value)}
            className="dt-mono mt-1 h-11 w-full rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
            spellCheck={false}
          />
        </label>
      </div>
      <div className="mt-3">
        <Editor id="regex-text" label="Test text" value={text} onChange={setText} />
      </div>
      <label className="mt-3 block text-sm text-[var(--dt-muted)]">
        Replacement preview (optional)
        <input
          value={replacement}
          onChange={(event) => setReplacement(event.target.value)}
          className="dt-mono mt-1 h-11 w-full rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
          spellCheck={false}
        />
      </label>
      {result && !result.ok ? <Alert>{result.error}</Alert> : null}
      {result?.ok ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <OutputFrame label="Highlights">
            <HighlightedText text={text} matches={result.matches} />
          </OutputFrame>
          <OutputFrame label="Groups">
            {result.matches.length === 0 ? <p>No matches.</p> : null}
            <ol className="space-y-2">
              {result.matches.map((match, index) => (
                <li key={`${match.index}-${index}`}>
                  <p>
                    {index + 1}. “{match.text}” at {match.index}
                  </p>
                  {match.groups.length > 0 ? <p className="text-[var(--dt-muted)]">Groups: {match.groups.map((group) => group ?? "∅").join(", ")}</p> : null}
                  {Object.keys(match.named).length > 0 ? (
                    <p className="text-[var(--dt-muted)]">{Object.entries(match.named).map(([key, value]) => `${key}=${value}`).join(", ")}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </OutputFrame>
          {result.replaced !== undefined ? (
            <div className="lg:col-span-2">
              <OutputFrame label="Replace preview">
                <pre className="whitespace-pre-wrap break-all">{result.replaced}</pre>
              </OutputFrame>
            </div>
          ) : null}
        </div>
      ) : null}
      <StatusBar>
        {result?.ok
          ? `${result.matches.length} shown${result.truncated ? " · stopped at the match cap" : ""} · without g, replace changes only the first match`
          : "Run a pattern to see matches."}
      </StatusBar>
    </Workspace>
  );
}

function HighlightedText({
  text,
  matches,
}: {
  text: string;
  matches: { index: number; text: string }[];
}) {
  const shown = text.slice(0, 8000);
  const parts: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.index >= shown.length) break;
    if (match.index < cursor) continue;
    if (match.index > cursor) parts.push({ text: shown.slice(cursor, match.index), hit: false });
    const end = Math.min(match.index + match.text.length, shown.length);
    parts.push({ text: shown.slice(match.index, end), hit: true });
    cursor = end;
  }
  if (cursor < shown.length) parts.push({ text: shown.slice(cursor), hit: false });
  return (
    <pre className="whitespace-pre-wrap break-all">
      {parts.map((part, index) =>
        part.hit ? (
          <mark key={index} className="rounded bg-[#BBF7D0] text-[#064E3B] [[data-theme=dark]_&]:bg-[#134E4A] [[data-theme=dark]_&]:text-[#CCFBF1]">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
      {text.length > 8000 ? "\n… Highlight preview stopped at 8,000 characters." : null}
    </pre>
  );
}
