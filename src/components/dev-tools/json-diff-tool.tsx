"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Editor,
  HighlightedJson,
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
import { diffJson, summarizeDiff, type DiffEntry } from "@/lib/dev-tools/json-diff";
import { parseJson } from "@/lib/dev-tools/json";

const LEFT = `{
  "version": 1,
  "enabled": true,
  "tags": ["json", "diff"]
}`;

const RIGHT = `{
  "enabled": true,
  "version": "1",
  "tags": ["json", "diff", "csv"]
}`;

export function JsonDiffTool() {
  const [left, setLeft] = useState(LEFT);
  const [right, setRight] = useState(RIGHT);
  const [pane, setPane] = useState<"input" | "output">("input");
  const { copied, copy } = useCopyFlag();
  const parsedLeft = useMemo(() => parseJson(left), [left]);
  const parsedRight = useMemo(() => parseJson(right), [right]);
  const changes = parsedLeft.ok && parsedRight.ok ? diffJson(parsedLeft.value, parsedRight.value) : [];
  const summary = parsedLeft.ok && parsedRight.ok ? summarizeDiff(changes) : "";

  return (
    <Workspace>
      <Toolbar>
        <ToolButton
          onClick={() => {
            trackTool("json-diff", "compare");
            setPane("output");
          }}
        >
          Compare
        </ToolButton>
        <ToolButton tone="ghost" disabled={!summary} onClick={() => summary && void copy(summary, "json-diff")}>
          {copied ? "Copied" : "Copy summary"}
        </ToolButton>
        <ToolButton
          tone="ghost"
          disabled={!summary}
          onClick={() => {
            if (!summary) return;
            trackTool("json-diff", "download");
            downloadText("json-diff.txt", summary);
          }}
        >
          Download summary
        </ToolButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setLeft(LEFT);
            setRight(RIGHT);
            trackTool("json-diff", "example");
          }}
        >
          Example
        </ToolButton>
      </Toolbar>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <div className="grid gap-3">
            <Editor id="json-left" label="Original JSON" value={left} onChange={setLeft} />
            <Editor id="json-right" label="Revised JSON" value={right} onChange={setRight} />
          </div>
        </div>
        <div className={paneClass(pane === "output")}>
          <OutputFrame label="Structural diff">
            {!parsedLeft.ok ? <p>{parsedLeft.error}</p> : null}
            {parsedLeft.ok && !parsedRight.ok ? <p>{parsedRight.error}</p> : null}
            {summary ? <DiffList changes={changes} summary={summary} /> : null}
          </OutputFrame>
        </div>
      </div>
      {!parsedLeft.ok ? <Alert>{`Original: ${parsedLeft.error}`}</Alert> : null}
      {parsedLeft.ok && !parsedRight.ok ? <Alert>{`Revised: ${parsedRight.error}`}</Alert> : null}
      <StatusBar>
        {summary
          ? `${changes.length} changes · key order ignored · arrays by index`
          : "Both sides need to be valid JSON."}
      </StatusBar>
    </Workspace>
  );
}

function DiffList({ changes, summary }: { changes: DiffEntry[]; summary: string }) {
  if (changes.length === 0) return <p>No structural differences. Object key order is ignored.</p>;
  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {changes.map((change) => (
          <li key={`${change.kind}-${change.path}`} className="rounded-lg border border-[var(--dt-border)] bg-[var(--dt-card)] p-2">
            <p className={badgeClass(change.kind)}>{change.kind}</p>
            <p className="mt-1 break-all">{change.path}</p>
            {change.kind === "modified" ? (
              <p className="mt-1 whitespace-pre-wrap break-all text-[var(--dt-muted)]">{lineFor(change)}</p>
            ) : (
              <p className="mt-1 break-all text-[var(--dt-muted)]">{JSON.stringify(change.kind === "added" ? change.right : change.left)}</p>
            )}
          </li>
        ))}
      </ul>
      <HighlightedJson text={summary} />
    </div>
  );
}

function lineFor(change: DiffEntry): string {
  return `${JSON.stringify(change.left)} → ${JSON.stringify(change.right)}`;
}

function badgeClass(kind: DiffEntry["kind"]) {
  if (kind === "added") return "text-xs font-semibold uppercase text-[#047857] [[data-theme=dark]_&]:text-[#6ee7b7]";
  if (kind === "removed") return "text-xs font-semibold uppercase text-[#B91C1C] [[data-theme=dark]_&]:text-[#fca5a5]";
  return "text-xs font-semibold uppercase text-[#9A3412] [[data-theme=dark]_&]:text-[#fdba74]";
}
