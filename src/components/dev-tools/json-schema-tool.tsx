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
} from "@/components/dev-tools/chrome";
import { parseJson } from "@/lib/dev-tools/json";
import { validateSchema } from "@/lib/dev-tools/json-schema";

const DATA = `{
  "id": 1
}`;

const SCHEMA = `{
  "type": "object",
  "required": ["id"],
  "additionalProperties": false,
  "properties": {
    "id": { "type": "number" }
  }
}`;

export function JsonSchemaTool() {
  const [data, setData] = useState(DATA);
  const [schema, setSchema] = useState(SCHEMA);
  const [pane, setPane] = useState<"input" | "output">("output");
  const parsedData = useMemo(() => parseJson(data), [data]);
  const parsedSchema = useMemo(() => parseJson(schema), [schema]);
  const result =
    parsedData.ok && parsedSchema.ok ? validateSchema(parsedData.value, parsedSchema.value) : null;

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        Checks a subset of JSON Schema draft 2020-12. Unsupported keywords are listed and the document is not treated as valid.
      </p>
      <Toolbar>
        <ToolButton
          onClick={() => {
            trackTool("json-schema", "validate");
            setPane("output");
          }}
        >
          Validate
        </ToolButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setData(DATA);
            setSchema(SCHEMA);
            trackTool("json-schema", "example");
          }}
        >
          Example
        </ToolButton>
      </Toolbar>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <div className="grid gap-3">
            <Editor id="schema-data" label="JSON data" value={data} onChange={setData} />
            <Editor id="schema-doc" label="JSON Schema" value={schema} onChange={setSchema} />
          </div>
        </div>
        <div className={paneClass(pane === "output")}>
          <OutputFrame label="Validation">
            {!parsedData.ok ? <p>Data: {parsedData.error}</p> : null}
            {parsedData.ok && !parsedSchema.ok ? <p>Schema: {parsedSchema.error}</p> : null}
            {result?.valid ? <p className="font-semibold text-[var(--dt-primary)]">Valid for the supported subset.</p> : null}
            {result && !result.valid ? (
              <ul className="space-y-2">
                {result.errors.map((error, index) => (
                  <li key={`${error.path}-${index}`}>
                    <span className="dt-key">{error.path}</span>
                    <span> — {error.message}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </OutputFrame>
        </div>
      </div>
      {!parsedData.ok ? <Alert>{`Data: ${parsedData.error}`}</Alert> : null}
      {parsedData.ok && !parsedSchema.ok ? <Alert>{`Schema: ${parsedSchema.error}`}</Alert> : null}
      <StatusBar>{result ? (result.valid ? "No errors." : `${result.errors.length} errors`) : "Paste data and a schema."}</StatusBar>
    </Workspace>
  );
}
