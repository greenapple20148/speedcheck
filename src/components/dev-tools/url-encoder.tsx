"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Editor,
  OutputFrame,
  PaneSwitch,
  StatusBar,
  Toolbar,
  ToolButton,
  Workspace,
  paneClass,
  trackTool,
  useCopyFlag,
} from "@/components/dev-tools/chrome";
import { buildUrl, decodeComponent, decodeUrl, encodeComponent, encodeUrl, parseUrlQuery, type QueryParam } from "@/lib/dev-tools/url-codec";

export function UrlEncoderTool() {
  const [mode, setMode] = useState<"component" | "url">("component");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("a b/ç");
  const [queryText, setQueryText] = useState("https://example.com/search?q=caf%C3%A9&x=1");
  const [params, setParams] = useState<QueryParam[] | null>(null);
  const [base, setBase] = useState("");
  const [queryError, setQueryError] = useState<string | null>(null);
  const [pane, setPane] = useState<"input" | "output">("output");
  const { copied, copy } = useCopyFlag();

  const result = useMemo(() => {
    if (direction === "encode") {
      return { ok: true as const, text: mode === "component" ? encodeComponent(input) : encodeUrl(input) };
    }
    const decoded = mode === "component" ? decodeComponent(input) : decodeUrl(input);
    return decoded.ok ? { ok: true as const, text: decoded.value } : { ok: false as const, error: decoded.error };
  }, [direction, input, mode]);

  function loadQuery() {
    trackTool("url-encoder", "convert");
    const parsed = parseUrlQuery(queryText);
    if (!parsed.ok) {
      setQueryError(parsed.error);
      setParams(null);
      return;
    }
    setQueryError(null);
    setBase(parsed.base);
    setParams(parsed.params);
  }

  const rebuilt = params ? buildUrl(base, params) : "";

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        Component mode uses encodeURIComponent. Full URL mode uses encodeURI and keeps characters such as : / ? #. The query editor encodes spaces as +.
      </p>
      <Toolbar>
        <ToolButton tone={mode === "component" ? "primary" : "ghost"} onClick={() => setMode("component")}>
          Component
        </ToolButton>
        <ToolButton tone={mode === "url" ? "primary" : "ghost"} onClick={() => setMode("url")}>
          Full URL
        </ToolButton>
        <ToolButton tone={direction === "encode" ? "primary" : "ghost"} onClick={() => { setDirection("encode"); trackTool("url-encoder", "encode"); }}>
          Encode
        </ToolButton>
        <ToolButton tone={direction === "decode" ? "primary" : "ghost"} onClick={() => { setDirection("decode"); trackTool("url-encoder", "decode"); }}>
          Decode
        </ToolButton>
        <ToolButton tone="ghost" disabled={!result.ok} onClick={() => result.ok && void copy(result.text, "url-encoder")}>
          {copied ? "Copied" : "Copy"}
        </ToolButton>
      </Toolbar>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <Editor id="url-input" label="Text" value={input} onChange={setInput} />
        </div>
        <div className={paneClass(pane === "output")}>
          <OutputFrame label="Result">
            {result.ok ? <pre className="whitespace-pre-wrap break-all">{result.text}</pre> : <p>{result.error}</p>}
          </OutputFrame>
        </div>
      </div>
      {!result.ok ? <Alert>{result.error}</Alert> : null}
      <div className="mt-6 border-t border-[var(--dt-border)] pt-4">
        <h2 className="font-heading text-lg font-semibold text-[var(--dt-text)]">Query editor</h2>
        <label className="mt-3 block text-sm text-[var(--dt-muted)]">
          URL or query string
          <input
            value={queryText}
            onChange={(event) => setQueryText(event.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
            spellCheck={false}
          />
        </label>
        <div className="mt-3">
          <ToolButton onClick={loadQuery}>Parse query</ToolButton>
        </div>
        {queryError ? <Alert>{queryError}</Alert> : null}
        {params ? (
          <div className="mt-3 space-y-2">
            {params.length === 0 ? <p className="text-sm text-[var(--dt-muted)]">No query parameters.</p> : null}
            {params.map((param, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-2">
                <input
                  aria-label={`Parameter ${index + 1} name`}
                  value={param.key}
                  onChange={(event) => updateParam(index, { ...param, key: event.target.value })}
                  className="h-10 rounded-lg border border-[var(--dt-border)] bg-[var(--dt-card)] px-3 text-sm text-[var(--dt-text)]"
                />
                <input
                  aria-label={`Parameter ${index + 1} value`}
                  value={param.value}
                  onChange={(event) => updateParam(index, { ...param, value: event.target.value })}
                  className="h-10 rounded-lg border border-[var(--dt-border)] bg-[var(--dt-card)] px-3 text-sm text-[var(--dt-text)]"
                />
              </div>
            ))}
            <ToolButton tone="ghost" onClick={() => setParams([...params, { key: "", value: "" }])}>
              Add parameter
            </ToolButton>
            <p className="break-all text-sm text-[var(--dt-text)]">{rebuilt}</p>
          </div>
        ) : null}
      </div>
      <StatusBar>Invalid % sequences are reported. Unicode is encoded as UTF-8 bytes.</StatusBar>
    </Workspace>
  );

  function updateParam(index: number, next: QueryParam) {
    setParams((current) => current?.map((item, itemIndex) => (itemIndex === index ? next : item)) ?? null);
  }
}
