"use client";

import { RouterConnectionCard } from "@/components/mesh/router-connection-card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function RouterConnectionDialog({ className }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={className ?? "min-h-11 rounded-xl border border-border px-3 text-sm"}>
          Connect to router
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(85vh,760px)] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect to router</DialogTitle>
          <DialogDescription>
            Choose the router, then open its own admin page. MySpeedGauge does not sign in and does not store the gateway address.
          </DialogDescription>
        </DialogHeader>
        <RouterConnectionCard />
      </DialogContent>
    </Dialog>
  );
}
