# Release a reviewed retention hold

Run from this folder:

```bash
node scripts/visitors.mjs release-hold <visit-code> --confirm --actor=operator
```

Read the relevant visit and site before changing a record. Use actual evidence; never infer approval, presence, notice delivery or an induction from a name. Actor labels are operator references, not authenticated identities.
Show the exact record and hold first. Get the operator's explicit approval in this session before using --confirm. Redaction does not remove generated reports, exports, drafts or backups; include those in the disposal plan.

Present the returned records in plain language. Use --json for analysis. Do not send, grant access or publish anything.
