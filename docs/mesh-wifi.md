# Mesh Wi-Fi planner

The mesh tools live under `/mesh-wifi`. They do not start a speed test on their own and they do not change the existing speed-test pages.

## What is measured

Room tests reuse the existing HTTP speed test. A saved room row stores download, upload, latency, jitter, time, and the endpoint name. It is throughput to that server, not RSSI, and not the name of the mesh node the phone joined. The room page colors saved downloads against the best saved room. A room with no test stays blank. A slower room is not called a dead zone.

## What is estimated

The floor-plan colors are computed in the browser. For each cell the model starts at 100 beside a node and subtracts:

- about 0.45, 0.7, or 0.9 points per foot on 2.4, 5, and 6 GHz
- a typical wall loss when the path enters a room (drywall 3 dB, brick 10 dB, concrete 15 dB, each dB worth 1.4 points)
- 14 points per floor of separation, from a lower starting score of 70

Strong is 62 or above, moderate 40, weak 18, and below that a possible dead zone. These are planning assumptions, not a survey. The node calculator uses 1,400 sq ft per node for drywall, less for masonry, plus 45 percent area for each floor after the first, and it will not suggest more than four nodes to start.

Placement options space nodes, prefer marked Ethernet outlets, or move toward priority rooms. They are not an optimal search.

## Privacy

The plan is stored in `localStorage` under `myspeedgauge_mesh_plan_v1`. Export downloads that JSON. Import rejects files that contain password, credential, secret, or admin fields. There is no Wi-Fi password field.

Connect to router stays in the browser. It checks the gateway address locally and, after confirmation, opens that page in a new tab. The gateway is not written into the saved plan, analytics, or Supabase, and the server does not call the router.

`supabase/migrations/20261101010000_mesh_plans.sql` adds an owner-only `mesh_plans` table. The app does not write it. Cloud sync stays off until sign-in exists and the visitor asks for it.

## Print

`/mesh-wifi/report` is noindex. Print uses the browser dialog, including Save as PDF. No PDF library was added.

## Ads

Slots render only when ads are already enabled for the site, and only under calculator results, backhaul advice, troubleshooting, comparison, and guides. The floor-plan controls do not include an ad.
