"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminAnalyticsPage() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const res = await fetch("/api/admin/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setError("Unauthorized or failed to load");
      setData(null);
      return;
    }
    setData(await res.json());
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="heading-1 text-foreground">Internal analytics</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Protected dashboard. Provide the admin token from your environment.
      </p>
      <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
        <Label htmlFor="token">Admin token</Label>
        <Input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
        />
        <Button onClick={load} className="rounded-full bg-primary hover:bg-primary-hover">
          Load metrics
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      {data && (
        <pre className="mt-6 overflow-auto rounded-2xl border border-border bg-muted/40 p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
