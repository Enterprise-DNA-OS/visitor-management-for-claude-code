# Add a site and its policies

Run from this folder:

```bash
node scripts/visitors.mjs add-site --code=AKL2 --name="Second office" --timezone=Pacific/Auckland --notice=privacy-v1 --induction=visitor-v1 --retention-days=90 --max-hours=12 --actor=operator
```

Read the relevant visit and site before changing a record. Use actual evidence; never infer approval, presence, notice delivery or an induction from a name. Actor labels are operator references, not authenticated identities.

Present the returned records in plain language. Use --json for analysis. Do not send, grant access or publish anything.
