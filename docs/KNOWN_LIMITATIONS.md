# Known Limitations

1. **Loopback Mbps is not representative.** Local tests against `127.0.0.1` can show multi-gigabit figures due to zero WAN latency. Validate against a remote VPS for production accuracy.
2. **Browser TCP slow-start** means very short tests can under-read on high-latency paths; standard mode mitigates with multi-connection sampling.
3. **Supabase is optional locally.** Without credentials, results use `.data/results.json` (dev only).
4. **ISP enrichment** depends on edge headers or `ipapi.co`; may be empty offline or when egress is blocked.
5. **AdSense/GA4 inactive** until IDs and feature flags are set; placeholders remain.
6. **Account-based history** schema supports `user_id` but full auth UX is deferred.
7. **Aggregate statistics** table requires ≥30 samples before public exposure; aggregation job not yet scheduled.
8. **Single measurement region** in local Docker; multi-region selection UI lists the configured server.
9. **Quota accuracy tradeoff:** aggressive budgets shorten tests on multi-gigabit links.
10. **Next.js 16** no longer ships `next lint`; project uses ESLint flat config instead.
