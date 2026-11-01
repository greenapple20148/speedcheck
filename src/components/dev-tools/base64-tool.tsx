"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Editor,
  FileButton,
  OutputFrame,
  PaneSwitch,
  StatusBar,
  Toolbar,
  ToolButton,
  Workspace,
  downloadBytes,
  downloadText,
  paneClass,
  readLocalFile,
  trackTool,
  useCopyFlag,
} from "@/components/dev-tools/chrome";
import { decodeUtf8, encodeBytes, encodeUtf8, type Base64Variant } from "@/lib/dev-tools/base64";

export function Base64Tool() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [variant, setVariant] = useState<Base64Variant>("standard");
  const [input, setInput] = useState("héllo 😀");
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pane, setPane] = useState<"input" | "output">("output");
  const [fileError, setFileError] = useState<string | null>(null);
  const { copied, copy } = useCopyFlag();

  const result = useMemo(() => {
    if (mode === "encode") {
      if (fileBytes) return { ok: true as const, text: encodeBytes(fileBytes, variant), bytes: null as Uint8Array | null };
      const encoded = encodeUtf8(input, variant);
      return encoded.ok ? { ok: true as const, text: encoded.encoded, bytes: null } : { ok: false as const, error: encoded.error, bytes: undefined };
    }
    const decoded = decodeUtf8(input, variant);
    if (decoded.ok) return { ok: true as const, text: decoded.text, bytes: decoded.bytes };
    return { ok: false as const, error: decoded.error, bytes: decoded.bytes };
  }, [fileBytes, input, mode, variant]);

  return (
    <Workspace>
      <p className="mb-3 text-sm leading-6 text-[var(--dt-muted)]">
        Base64 is an encoding, not encryption. Text is UTF-8. URL-safe output uses - and _ and drops = padding.
      </p>
      <Toolbar>
        <ToolButton tone={mode === "encode" ? "primary" : "ghost"} onClick={() => { setMode("encode"); setFileBytes(null); trackTool("base64", "encode"); }}>
          Encode
        </ToolButton>
        <ToolButton tone={mode === "decode" ? "primary" : "ghost"} onClick={() => { setMode("decode"); setFileBytes(null); trackTool("base64", "decode"); }}>
          Decode
        </ToolButton>
        <ToolButton tone={variant === "standard" ? "primary" : "ghost"} onClick={() => setVariant("standard")}>
          Standard
        </ToolButton>
        <ToolButton tone={variant === "url" ? "primary" : "ghost"} onClick={() => setVariant("url")}>
          URL-safe
        </ToolButton>
        <ToolButton tone="ghost" disabled={!result.ok || !result.text} onClick={() => result.ok && void copy(result.text, "base64")}>
          {copied ? "Copied" : "Copy"}
        </ToolButton>
        <ToolButton
          tone="ghost"
          disabled={!result.ok && !result.bytes}
          onClick={() => {
            trackTool("base64", "download");
            if (!result.ok && result.bytes) {
              downloadBytes(fileName || "decoded.bin", result.bytes, "application/octet-stream");
              return;
            }
            if (!result.ok) return;
            if (mode === "decode" && result.bytes) downloadBytes(fileName || "decoded.bin", result.bytes, "application/octet-stream");
            else downloadText(variant === "url" ? "encoded.urlb64.txt" : "encoded.b64.txt", result.text);
          }}
        >
          Download
        </ToolButton>
        <FileButton
          accept="*/*"
          onFile={(file) => {
            void readLocalFile(file, mode === "encode" ? "bytes" : "text").then((fileResult) => {
              if (!fileResult.ok) {
                setFileError(fileResult.error);
                return;
              }
              setFileError(null);
              setFileName(file.name);
              if (mode === "encode") {
                setFileBytes(fileResult.bytes);
                setInput("");
              } else {
                setFileBytes(null);
                setInput(fileResult.text);
              }
              trackTool("base64", "upload");
            });
          }}
        >
          Upload
        </FileButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setInput("héllo 😀");
            setFileBytes(null);
            setMode("encode");
            trackTool("base64", "example");
          }}
        >
          Example
        </ToolButton>
      </Toolbar>
      <PaneSwitch value={pane} onChange={setPane} />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={paneClass(pane === "input")}>
          <Editor
            id="base64-input"
            label={fileBytes ? `File ${fileName}` : mode === "encode" ? "Text" : "Base64"}
            value={fileBytes ? `${fileName} (${fileBytes.byteLength.toLocaleString("en-US")} bytes)` : input}
            onChange={(value) => {
              setFileBytes(null);
              setInput(value);
            }}
          />
        </div>
        <div className={paneClass(pane === "output")}>
          <OutputFrame label={mode === "encode" ? "Base64" : "Decoded text"}>
            {result.ok ? (
              <pre className="whitespace-pre-wrap break-all">{result.text || "Empty result."}</pre>
            ) : (
              <p>{result.error}</p>
            )}
          </OutputFrame>
        </div>
      </div>
      {fileError ? <Alert>{fileError}</Alert> : null}
      {!result.ok ? <Alert>{result.error}</Alert> : null}
      <StatusBar>
        {result.ok
          ? mode === "encode"
            ? `${variant === "url" ? "URL-safe" : "Standard"} Base64`
            : "Decoded as UTF-8"
          : "Check the input."}
      </StatusBar>
    </Workspace>
  );
}
