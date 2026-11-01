"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  Alert,
  Editor,
  FileButton,
  HighlightedJson,
  ModeTabs,
  OutputFrame,
  PaneSwitch,
  StatusBar,
  Toolbar,
  ToolButton,
  Workspace,
  downloadText,
  paneClass,
  readLocalFile,
  trackTool,
  useCopyFlag,
} from "@/components/dev-tools/chrome";
import { findMatches, formatJsonText, jsonStats, minifyJsonText, parseJson, typeName } from "@/lib/dev-tools/json";

const SAMPLE = `{
  "service": "MySpeedGauge",
  "online": true,
  "version": 1,
  "tools": ["json", "csv"]
}`;

const TABS = [
  { id: "format", label: "Formatter" },
  { id: "validate", label: "Validator" },
  { id: "tree", label: "Tree" },
  { id: "minify", label: "Minify" },
];

export function JsonFormatterTool() {
  const [input, setInput] = useState(SAMPLE);
  const [space, setSpace] = useState<2 | 4>(2);
  const [mode, setMode] = useState("format");
  const [query, setQuery] = useState("");
  const [matchAt, setMatchAt] = useState(0);
  const [pane, setPane] = useState<"input" | "output">("input");
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { copied, copy } = useCopyFlag();

  const formatted = useMemo(() => formatJsonText(input, space), [input, space]);
  const minified = useMemo(() => (formatted.ok ? minifyJsonText(input) : formatted), [formatted, input]);
  const output = mode === "minify" ? (minified.ok ? minified.text : "") : formatted.ok ? formatted.text : "";
  const matches = useMemo(() => findMatches(input, query, false), [input, query]);

  function formatNow() {
    trackTool("json-formatter", "format");
    setMode("format");
    setPane("output");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      formatNow();
    }
  }

  function jump(next: number) {
    if (matches.length === 0 || !query) return;
    const index = (next + matches.length) % matches.length;
    setMatchAt(index);
    const start = matches[index] ?? 0;
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    node.setSelectionRange(start, start + query.length);
  }

  return (
    <Workspace>
      <ModeTabs label="JSON workspace" tabs={TABS} value={mode} onChange={setMode} />
      <Toolbar>
        <ToolButton onClick={formatNow}>Format</ToolButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            trackTool("json-formatter", "minify");
            setMode("minify");
            setPane("output");
          }}
        >
          Minify
        </ToolButton>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--dt-muted)]">
          Indent
          <select
            className="h-9 rounded-full border border-[var(--dt-border)] bg-[var(--dt-card)] pl-3 text-sm text-[var(--dt-text)]"
            value={space}
            onChange={(event) => setSpace(event.target.value === "4" ? 4 : 2)}
            aria-label="Indent size"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </label>
        <ToolButton tone="ghost" onClick={() => output && void copy(output, "json-formatter")} disabled={!output}>
          {copied ? "Copied" : "Copy"}
        </ToolButton>
        <ToolButton
          tone="ghost"
          disabled={!output}
          onClick={() => {
            if (!output) return;
            trackTool("json-formatter", "download");
            downloadText(mode === "minify" ? "data.min.json" : "data.json", output, "application/json;charset=utf-8");
          }}
        >
          Download
        </ToolButton>
        <FileButton
          accept="application/json,.json,.txt"
          onFile={(file) => {
            void readLocalFile(file, "text").then((result) => {
              if (!result.ok) {
                setFileError(result.error);
                return;
              }
              setFileError(null);
              setInput(result.text);
              trackTool("json-formatter", "upload");
            });
          }}
        >
          Upload
        </FileButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setInput("");
            trackTool("json-formatter", "clear");
          }}
        >
          Clear
        </ToolButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setInput(SAMPLE);
            trackTool("json-formatter", "example");
          }}
        >
          Example
        </ToolButton>
      </Toolbar>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="min-w-0 flex-1 text-sm text-[var(--dt-muted)]">
          <span className="sr-only">Search in the JSON text</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setMatchAt(0);
            }}
            placeholder="Search in text"
            className="h-9 w-full rounded-full border border-[var(--dt-border)] bg-[var(--dt-card)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
          />
        </label>
        <ToolButton tone="ghost" onClick={() => jump(matchAt - 1)} disabled={matches.length === 0}>
          Previous
        </ToolButton>
        <ToolButton tone="ghost" onClick={() => jump(matchAt + 1)} disabled={matches.length === 0}>
          Next
        </ToolButton>
        <span className="text-xs text-[var(--dt-muted)]">{query ? `${matches.length} matches` : "Search the input"}</span>
      </div>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <Editor id="json-input" label="Input" value={input} onChange={setInput} onKeyDown={onKeyDown} inputRef={inputRef} />
        </div>
        <div className={paneClass(pane === "output")}>
          {mode === "validate" ? <ValidationReport input={input} /> : null}
          {mode === "tree" ? <TreeReport input={input} /> : null}
          {mode === "format" || mode === "minify" ? (
            <OutputFrame label={mode === "minify" ? "Minified" : "Formatted"}>
              {output ? <HighlightedJson text={output} /> : <span className="text-[var(--dt-muted)]">The result appears here.</span>}
            </OutputFrame>
          ) : null}
        </div>
      </div>
      {fileError ? <Alert>{fileError}</Alert> : null}
      {!formatted.ok && mode !== "validate" ? <Alert>{formatted.error}</Alert> : null}
      <StatusBar>
        {formatted.ok
          ? `${typeName(formatted.value)} · ${formatted.stats.bytes.toLocaleString("en-US")} bytes · ${formatted.stats.keys} keys · depth ${formatted.stats.depth}`
          : "Invalid JSON"}
        {" · "}Ctrl+Enter or ⌘+Enter formats
      </StatusBar>
    </Workspace>
  );
}

function ValidationReport({ input }: { input: string }) {
  const parsed = parseJson(input);
  const stats = parsed.ok ? jsonStats(parsed.value, input) : null;
  return (
    <OutputFrame label="Validator">
      {parsed.ok ? (
        <div>
          <p className="font-semibold text-[var(--dt-primary)]">Valid JSON</p>
          <ul className="mt-3 space-y-1 text-[var(--dt-text)]">
            <li>Type: {typeName(parsed.value)}</li>
            <li>Keys: {stats?.keys}</li>
            <li>Objects: {stats?.objects}</li>
            <li>Arrays: {stats?.arrays}</li>
            <li>Strings: {stats?.strings}</li>
            <li>Numbers: {stats?.numbers}</li>
            <li>Booleans: {stats?.booleans}</li>
            <li>Nulls: {stats?.nulls}</li>
          </ul>
        </div>
      ) : (
        <div>
          <p className="font-semibold text-[#991B1B] [[data-theme=dark]_&]:text-[#FECACA]">Invalid JSON</p>
          <p className="mt-2 whitespace-pre-wrap">{parsed.error}</p>
          {parsed.line && parsed.column ? (
            <p className="mt-2">
              Line {parsed.line}, column {parsed.column}
            </p>
          ) : null}
        </div>
      )}
    </OutputFrame>
  );
}

function TreeReport({ input }: { input: string }) {
  const parsed = parseJson(input);
  if (!parsed.ok) {
    return (
      <OutputFrame label="Tree">
        <p>{parsed.error}</p>
      </OutputFrame>
    );
  }
  return (
    <OutputFrame label="Tree">
      <TreeNode name={null} value={parsed.value} depth={0} />
    </OutputFrame>
  );
}

function TreeNode({ name, value, depth }: { name: string | null; value: unknown; depth: number }) {
  const complex = value !== null && typeof value === "object";
  const [open, setOpen] = useState(depth < 2);
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : value !== null && typeof value === "object"
      ? Object.entries(value as Record<string, unknown>)
      : [];
  if (!complex) {
    return (
      <div className="whitespace-pre-wrap" style={{ paddingLeft: depth * 14 }}>
        {name !== null ? <span className="dt-key">{JSON.stringify(name)}: </span> : null}
        <span className={typeof value === "string" ? "dt-string" : typeof value === "number" ? "dt-number" : "dt-literal"}>
          {JSON.stringify(value)}
        </span>
      </div>
    );
  }
  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button
        type="button"
        className="text-left"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden>{open ? "▾" : "▸"} </span>
        {name !== null ? <span className="dt-key">{JSON.stringify(name)}: </span> : null}
        <span className="text-[var(--dt-muted)]">{Array.isArray(value) ? `Array(${entries.length})` : `Object(${entries.length})`}</span>
      </button>
      {open
        ? entries.map(([key, child]) => <TreeNode key={`${depth}-${key}`} name={key} value={child} depth={depth + 1} />)
        : null}
    </div>
  );
}
