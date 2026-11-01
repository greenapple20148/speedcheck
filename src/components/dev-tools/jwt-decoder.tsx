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
import { decodeJwt } from "@/lib/dev-tools/jwt";

export function JwtDecoderTool() {
  const [token, setToken] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState("");

  function decode() {
    trackTool("jwt-decoder", "decode");
    setNow(Date.now());
    setSubmitted(token);
  }

  const result = submitted && now != null ? decodeJwt(submitted, now) : null;

  return (
    <Workspace>
      <p className="mb-3 rounded-xl border border-[var(--dt-border)] bg-[var(--dt-pale)] px-3 py-2 text-sm leading-6 text-[var(--dt-text)]">
        The signature is not checked. A decoded payload is not verified. This page does not save the token or send it anywhere.
      </p>
      <Toolbar>
        <ToolButton onClick={decode}>Decode</ToolButton>
        <ToolButton
          tone="ghost"
          onClick={() => {
            setToken("");
            setSubmitted("");
            trackTool("jwt-decoder", "clear");
          }}
        >
          Clear
        </ToolButton>
      </Toolbar>
      <Editor id="jwt-input" label="Token" value={token} onChange={setToken} placeholder="header.payload.signature" />
      {result && !result.ok ? <Alert>{result.error}</Alert> : null}
      {result?.ok ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <OutputFrame label="Header">
            <pre className="whitespace-pre-wrap break-all">{result.headerText}</pre>
          </OutputFrame>
          <OutputFrame label="Payload">
            <pre className="whitespace-pre-wrap break-all">{result.payloadText}</pre>
          </OutputFrame>
          <div className="lg:col-span-2">
            <OutputFrame label="Claims">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--dt-muted)]">alg (not checked)</dt>
                  <dd className="break-all">{result.algorithm ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--dt-muted)]">iss</dt>
                  <dd className="break-all">{formatClaim(result.iss)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--dt-muted)]">aud</dt>
                  <dd className="break-all">{formatClaim(result.aud)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--dt-muted)]">iat</dt>
                  <dd>{result.iat ? `${result.iat.iso} (${result.iat.seconds})` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--dt-muted)]">exp</dt>
                  <dd>{result.exp ? `${result.exp.iso} (${result.exp.seconds})` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--dt-muted)]">Expiration</dt>
                  <dd>{result.expired == null ? "No exp claim" : result.expired ? "Expired" : "Not expired"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[var(--dt-muted)]">Signature segment (not checked): {result.signature || "(empty)"}</p>
              <p className="mt-2">{result.notice}</p>
            </OutputFrame>
          </div>
        </div>
      ) : null}
      <StatusBar>Signature checked: no. Nothing from this token is written to local storage.</StatusBar>
    </Workspace>
  );
}

function formatClaim(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}
