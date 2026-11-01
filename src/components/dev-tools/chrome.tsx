"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { tokenizeJson } from "@/lib/dev-tools/highlight";
import { byteLength, MAX_INPUT_BYTES } from "@/lib/dev-tools/limits";
import { cn } from "@/lib/utils";

export function trackTool(tool: string, action: string) {
  trackEvent("developer_tool", { tool, action });
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  triggerDownload(filename, blob);
}

export function downloadBytes(filename: string, bytes: Uint8Array, type: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  triggerDownload(filename, new Blob([copy.buffer], { type }));
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readLocalFile(
  file: File,
  mode: "text" | "bytes",
): Promise<{ ok: true; text: string; bytes: Uint8Array } | { ok: false; error: string }> {
  if (file.size > MAX_INPUT_BYTES) {
    return { ok: false, error: "That file is larger than 1.5 MB." };
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.byteLength > MAX_INPUT_BYTES) return { ok: false, error: "That file is larger than 1.5 MB." };
  if (mode === "bytes") return { ok: true, text: "", bytes };
  const text = new TextDecoder().decode(bytes);
  if (byteLength(text) > MAX_INPUT_BYTES) return { ok: false, error: "That file is larger than 1.5 MB." };
  return { ok: true, text, bytes };
}

export function ToolButton({
  children,
  onClick,
  tone = "primary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-full px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dt-accent)] disabled:cursor-not-allowed disabled:opacity-50",
        tone === "primary"
          ? "bg-[var(--dt-primary)] text-[var(--dt-on-primary)] hover:bg-[var(--dt-primary-hover)]"
          : "border border-[var(--dt-border)] bg-[var(--dt-card)] text-[var(--dt-text)] hover:bg-[var(--dt-pale)]",
      )}
    >
      {children}
    </button>
  );
}

export function ModeTabs({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className="mb-3 flex gap-1 overflow-x-auto">
      {tabs.map((tab) => {
        const selected = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "h-9 shrink-0 rounded-full px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dt-accent)]",
              selected
                ? "bg-[var(--dt-primary)] text-[var(--dt-on-primary)]"
                : "text-[var(--dt-muted)] hover:bg-[var(--dt-pale)] hover:text-[var(--dt-text)]",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function Workspace({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--dt-border)] bg-[var(--dt-card)] p-3 shadow-[0_1px_2px_rgba(16,35,31,0.04)] sm:p-4">
      {children}
    </section>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-2">{children}</div>;
}

export function Editor({
  id,
  label,
  value,
  onChange,
  onKeyDown,
  placeholder,
  inputRef,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  inputRef?: { current: HTMLTextAreaElement | null };
}) {
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--dt-muted)]">
        {label}
      </label>
      <textarea
        id={id}
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        placeholder={placeholder}
        className="dt-mono min-h-[260px] w-full min-w-0 resize-y rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] p-3 text-[13px] leading-5 text-[var(--dt-text)] outline-none focus:border-[var(--dt-accent)]"
      />
    </div>
  );
}

export function OutputFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--dt-muted)]">{label}</p>
      <div className="dt-mono min-h-[260px] max-h-[640px] overflow-auto rounded-xl border border-[var(--dt-border)] bg-[var(--dt-inset)] p-3 text-[13px] leading-5 text-[var(--dt-text)]">
        {children}
      </div>
    </div>
  );
}

export function HighlightedJson({ text }: { text: string }) {
  const limit = 200_000;
  const shown = text.length > limit ? text.slice(0, limit) : text;
  const tokens = tokenizeJson(shown);
  return (
    <pre className="whitespace-pre">
      {tokens.map((token, index) => (
        <span key={`${index}-${token.kind}`} className={token.kind === "plain" ? undefined : `dt-${token.kind}`}>
          {token.text}
        </span>
      ))}
      {text.length > limit ? "\n… Preview truncated. Download the full result." : null}
    </pre>
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B] [[data-theme=dark]_&]:border-[#7F1D1D] [[data-theme=dark]_&]:bg-[#3F1D1D] [[data-theme=dark]_&]:text-[#FECACA]"
    >
      {children}
    </p>
  );
}

export function StatusBar({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 min-w-0 text-xs leading-5 text-[var(--dt-muted)]" role="status">
      {children}
    </p>
  );
}

export function FileButton({
  accept,
  children,
  onFile,
}: {
  accept: string;
  children: ReactNode;
  onFile: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <ToolButton tone="ghost" onClick={() => ref.current?.click()}>
        {children}
      </ToolButton>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label="Upload a local file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </>
  );
}

export function useCopyFlag() {
  const [copied, setCopied] = useState(false);
  async function copy(value: string, tool: string) {
    const ok = await copyText(value);
    if (!ok) return;
    trackTool(tool, "copy");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }
  return { copied, copy };
}

export function PaneSwitch({
  value,
  onChange,
}: {
  value: "input" | "output";
  onChange: (value: "input" | "output") => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 rounded-full bg-[var(--dt-pale)] p-1 lg:hidden" role="tablist" aria-label="Editor pane">
      {(["input", "output"] as const).map((pane) => (
        <button
          key={pane}
          type="button"
          role="tab"
          aria-selected={value === pane}
          onClick={() => onChange(pane)}
          className={cn(
            "h-8 rounded-full text-sm font-semibold capitalize",
            value === pane ? "bg-[var(--dt-card)] text-[var(--dt-text)] shadow-sm" : "text-[var(--dt-muted)]",
          )}
        >
          {pane === "output" ? "Result" : "Input"}
        </button>
      ))}
    </div>
  );
}

export function paneClass(active: boolean) {
  return active ? "block min-w-0" : "hidden min-w-0 lg:block";
}
