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
  downloadText,
  paneClass,
  trackTool,
  useCopyFlag,
} from "@/components/dev-tools/chrome";
import { jsonTextToYaml } from "@/lib/dev-tools/yaml";

const SAMPLE = `{
  "name": "Ada",
  "title": "a: b",
  "ok": true,
  "items": [{ "id": 1 }, { "id": 2 }]
}`;

export function JsonToYamlTool() {
  const [input, setInput] = useState(SAMPLE);
  const [pane, setPane] = useState<"input" | "output">("input");
  const { copied, copy } = useCopyFlag();
  const result = useMemo(() => jsonTextToYaml(input), [input]);
  const yaml = result.ok ? result.yaml : "";

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        Output is block YAML for JSON values only. Anchors, tags, and comments are not produced.
      </p>
      <Toolbar>
        <ToolButton tone="ghost" disabled={!yaml} onClick={() => yaml && void copy(yaml, "json-to-yaml")}>
          {copied ? "Copied" : "Copy"}
        </ToolButton>
        <ToolButton
          tone="ghost"
          disabled={!yaml}
          onClick={() => {
            if (!yaml) return;
            trackTool("json-to-yaml", "download");
            downloadText("data.yml", yaml, "application/yaml;charset=utf-8");
          }}
        >
          Download
        </ToolButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setInput(SAMPLE);
            trackTool("json-to-yaml", "example");
          }}
        >
          Example
        </ToolButton>
      </Toolbar>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <Editor id="yaml-json" label="JSON" value={input} onChange={setInput} />
        </div>
        <div className={paneClass(pane === "output")}>
          <OutputFrame label="YAML">
            {yaml ? <pre className="whitespace-pre">{yaml}</pre> : <span className="text-[var(--dt-muted)]">YAML appears after the JSON parses.</span>}
          </OutputFrame>
        </div>
      </div>
      {!result.ok ? <Alert>{result.error}</Alert> : null}
      <StatusBar>{yaml ? `${yaml.length.toLocaleString("en-US")} characters of YAML` : "Waiting for JSON."}</StatusBar>
    </Workspace>
  );
}
