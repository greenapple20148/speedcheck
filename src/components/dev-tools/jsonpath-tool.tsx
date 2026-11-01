"use client";

import { useState } from "react";
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
} from "@/components/dev-tools/chrome";
import { parseJson } from "@/lib/dev-tools/json";
import { queryJsonPath } from "@/lib/dev-tools/jsonpath";

const SAMPLE = `{
  "store": {
    "book": [
      { "title": "A", "price": 5 },
      { "title": "B", "price": 12 }
    ]
  }
}`;

const EXAMPLES = [
  { label: "First title", path: "$.store.book[0].title" },
  { label: "Every title", path: "$.store.book[*].title" },
  { label: "Descendants", path: "$..title" },
  { label: "Price filter", path: "$.store.book[?(@.price < 10)].title" },
];

export function JsonPathTool() {
  const [input, setInput] = useState(SAMPLE);
  const [expression, setExpression] = useState(EXAMPLES[3].path);
  const [pane, setPane] = useState<"input" | "output">("output");
  const parsed = parseJson(input);
  const result = parsed.ok ? queryJsonPath(parsed.value, expression) : null;

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        Supported: <span className="dt-mono">.name</span>, <span className="dt-mono">[index]</span>, <span className="dt-mono">[*]</span>, <span className="dt-mono">[start:end]</span>, <span className="dt-mono">..name</span>, and <span className="dt-mono">[?(@.field == value)]</span>. Filters compare with ===-style equality, so 1 and &quot;1&quot; differ.
      </p>
      <Toolbar>
        {EXAMPLES.map((example) => (
          <ToolButton
            key={example.path}
            tone="ghost"
            onClick={() => {
              setExpression(example.path);
              trackTool("jsonpath", "example");
            }}
          >
            {example.label}
          </ToolButton>
        ))}
      </Toolbar>
      <label className="mb-3 block text-sm text-[var(--dt-muted)]">
        JSONPath
        <input
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          className="dt-mono mt-1 h-11 w-full rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] px-3 text-sm text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
          spellCheck={false}
        />
      </label>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <Editor id="jsonpath-doc" label="JSON" value={input} onChange={setInput} />
        </div>
        <div className={paneClass(pane === "output")}>
          <OutputFrame label="Matches">
            {!parsed.ok ? <p>{parsed.error}</p> : null}
            {parsed.ok && result && !result.ok ? <p>{result.error}</p> : null}
            {parsed.ok && result?.ok && result.matches.length === 0 ? <p>No matches.</p> : null}
            {parsed.ok && result?.ok ? (
              <ul className="space-y-3">
                {result.matches.map((match) => (
                  <li key={match.path}>
                    <p className="dt-key break-all">{match.path}</p>
                    <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(match.value, null, 2)}</pre>
                  </li>
                ))}
              </ul>
            ) : null}
          </OutputFrame>
        </div>
      </div>
      {!parsed.ok ? <Alert>{parsed.error}</Alert> : null}
      {parsed.ok && result && !result.ok ? <Alert>{result.error}</Alert> : null}
      <StatusBar>
        {result?.ok ? `${result.matches.length} matches${result.truncated ? " (stopped at the cap)" : ""}` : "Enter JSON and a path."}
      </StatusBar>
    </Workspace>
  );
}
