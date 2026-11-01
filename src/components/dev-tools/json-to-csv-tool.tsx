"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Editor,
  FileButton,
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
import { jsonToCsv, type CsvDelimiter } from "@/lib/dev-tools/csv";
import { parseJson } from "@/lib/dev-tools/json";

const SAMPLE = `[
  {
    "name": "Ada, Lovelace",
    "note": "say \\"hi\\"",
    "address": { "city": "Paris" },
    "tags": ["json", "csv"]
  }
]`;

export function JsonToCsvTool() {
  const [input, setInput] = useState(SAMPLE);
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(",");
  const [header, setHeader] = useState(true);
  const [bom, setBom] = useState(false);
  const [pane, setPane] = useState<"input" | "output">("input");
  const [fileError, setFileError] = useState<string | null>(null);
  const { copied, copy } = useCopyFlag();
  const parsed = useMemo(() => parseJson(input), [input]);
  const result = parsed.ok ? jsonToCsv(parsed.value, { delimiter, header }) : null;

  function download() {
    if (!result?.ok) return;
    trackTool("json-to-csv", "download");
    const body = bom ? `\uFEFF${result.csv}` : result.csv;
    downloadText("data.csv", body, "text/csv;charset=utf-8");
  }

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        Nested objects become dotted columns such as address.city. Nested arrays stay in one cell as JSON and do not become extra rows.
      </p>
      <Toolbar>
        <label className="text-sm text-[var(--dt-muted)]">
          Delimiter
          <select
            className="mt-1 h-9 rounded-lg border border-[var(--dt-border)] bg-[var(--dt-card)] pl-3 text-sm text-[var(--dt-text)]"
            value={delimiter}
            aria-label="Delimiter"
            onChange={(event) => setDelimiter(event.target.value as CsvDelimiter)}
          >
            <option value=",">Comma</option>
            <option value=";">Semicolon</option>
            <option value={"\t"}>Tab</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--dt-text)]">
          <input type="checkbox" checked={header} onChange={(event) => setHeader(event.target.checked)} />
          Header row
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--dt-text)]">
          <input type="checkbox" checked={bom} onChange={(event) => setBom(event.target.checked)} />
          UTF-8 BOM
        </label>
        <ToolButton
          tone="ghost"
          disabled={!result?.ok || !result.csv}
          onClick={() => result?.ok && void copy(result.csv, "json-to-csv")}
        >
          {copied ? "Copied" : "Copy"}
        </ToolButton>
        <ToolButton tone="ghost" disabled={!result?.ok || !result.csv} onClick={download}>
          Download
        </ToolButton>
        <FileButton
          accept="application/json,.json,.txt"
          onFile={(file) => {
            void readLocalFile(file, "text").then((fileResult) => {
              if (!fileResult.ok) {
                setFileError(fileResult.error);
                return;
              }
              setFileError(null);
              setInput(fileResult.text);
              trackTool("json-to-csv", "upload");
            });
          }}
        >
          Upload
        </FileButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setInput(SAMPLE);
            trackTool("json-to-csv", "example");
          }}
        >
          Example
        </ToolButton>
      </Toolbar>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <Editor id="csv-json" label="JSON array" value={input} onChange={setInput} />
        </div>
        <div className={paneClass(pane === "output")}>
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--dt-muted)]">Preview</p>
            <div className="max-h-[640px] overflow-auto rounded-xl border border-[var(--dt-border)]">
              {result?.ok && result.headers.length > 0 ? (
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-[var(--dt-pale)] text-[var(--dt-text)]">
                    <tr>
                      {result.headers.map((item) => (
                        <th key={item} className="whitespace-nowrap border-b border-[var(--dt-border)] px-3 py-2 font-semibold">
                          {item}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, 20).map((row, index) => (
                      <tr key={index}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${index}-${cellIndex}`} className="whitespace-pre border-b border-[var(--dt-border)] px-3 py-2 text-[var(--dt-text)]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-3 text-sm text-[var(--dt-muted)]">The table appears after the JSON parses as an array of objects.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {fileError ? <Alert>{fileError}</Alert> : null}
      {!parsed.ok ? <Alert>{parsed.error}</Alert> : null}
      {parsed.ok && result && !result.ok ? <Alert>{result.error}</Alert> : null}
      {result?.ok && result.warnings.length > 0 ? <Alert>{result.warnings[0]}</Alert> : null}
      <StatusBar>
        {result?.ok
          ? `${result.rows.length} rows · ${result.headers.length} columns · UTF-8`
          : "Waiting for an array of objects."}
        {result?.ok && result.rows.length > 20 ? " · preview shows the first 20 rows" : ""}
      </StatusBar>
    </Workspace>
  );
}
