# Visitor CLI

Node 20 or later. Run npm run migrate before use. All commands accept --json. Flags use --name=value; positional text with spaces needs quotes. Timestamp inputs must be ISO 8601 with an explicit offset. Database dates use UTC; site timezone is retained for the operator.

## List sites and local policies

```bash
node scripts/visitors.mjs sites
```

## List site hosts and availability

```bash
node scripts/visitors.mjs hosts
```

## List visit history

```bash
node scripts/visitors.mjs visits
```

## Read a visit and event history

```bash
node scripts/visitors.mjs visit <code-or-id>
```

## Prepare the next seven days of reception arrivals

```bash
node scripts/visitors.mjs arrivals
```

## Read the current reception register

```bash
node scripts/visitors.mjs onsite
```

## Reconcile overdue departures and missed arrivals

```bash
node scripts/visitors.mjs attention
```

## Review visits awaiting a host decision

```bash
node scripts/visitors.mjs approvals
```

## Review records due for a retention decision

```bash
node scripts/visitors.mjs retention-review
```

## Review collection notice, induction and retention evidence

```bash
node scripts/visitors.mjs compliance
```

## Read visit events

```bash
node scripts/visitors.mjs activity
```

## Answer ten cross-record questions

```bash
node scripts/visitors.mjs insights
```

## Add a site and its policies

```bash
node scripts/visitors.mjs add-site --code=AKL2 --name="Second office" --timezone=Pacific/Auckland --notice=privacy-v1 --induction=visitor-v1 --retention-days=90 --max-hours=12 --actor=operator
```

## Add a host at a site

```bash
node scripts/visitors.mjs add-host --site=AKL --name="Host name" --email=host@example.invalid --actor=operator
```

## Mark a host available or unavailable

```bash
node scripts/visitors.mjs set-host <host-email-or-id> --active=false --actor=operator
```

## Register an expected visitor

```bash
node scripts/visitors.mjs invite --site=AKL --host=mere@example.invalid --name="Visitor name" --email=visitor@example.invalid --company="Visitor company" --purpose="Supplier meeting" --at=2026-11-01T10:00:00+13:00 --until=2026-11-01T11:00:00+13:00 --actor=operator
```

## Record a host approval

```bash
node scripts/visitors.mjs approve <visit-code> --actor=host-reference
```

## Record a declined visit

```bash
node scripts/visitors.mjs deny <visit-code> --actor=host-reference
```

## Record evidence that the current notice and induction were provided

```bash
node scripts/visitors.mjs acknowledge <visit-code> --notice=privacy-2026-01 --induction=visitor-2026-02 --evidence=protected-evidence-reference --actor=operator
```

## Record arrival after approval and evidence checks

```bash
node scripts/visitors.mjs check-in <visit-code> --actor=operator
```

## Record a confirmed departure

```bash
node scripts/visitors.mjs check-out <visit-code> --actor=operator
```

## Cancel an expected visit

```bash
node scripts/visitors.mjs cancel <visit-code> --actor=operator
```

## Place a retention hold

```bash
node scripts/visitors.mjs hold <visit-code> --reason="Recorded retention requirement" --actor=operator
```

## Release a reviewed retention hold

```bash
node scripts/visitors.mjs release-hold <visit-code> --confirm --actor=operator
```

## Redact identifying visit fields after a retention decision

```bash
node scripts/visitors.mjs redact <visit-code> --confirm --actor=operator
```

## Record a reception follow-up event

```bash
node scripts/visitors.mjs log <visit-code> --code=host-contacted --actor=operator
```

## Import historical Envoy visitor records

```bash
node scripts/visitors.mjs import envoy imports/visitors.csv --site=AKL --offset=+13:00 --dry-run --actor=operator
```

## Export all business records locally

```bash
node scripts/visitors.mjs export
```

## Draft the weekly reception review

```bash
node scripts/visitors.mjs weekly-review
```

## Draft a host review note without sending

```bash
node scripts/visitors.mjs draft-host <visit-code>
```

Names match case-insensitively, IDs accept a unique prefix and exact codes win. Ambiguous matches list candidates and exit 1. log accepts host-contacted, arrival-reviewed, departure-reconciled or retention-reviewed.

Import --mapping=file.json maps canonical keys name, email, company, purpose, in, out, id, host and hostEmail to your export headers. No send command exists. Files go to drafts/, exports/, views/ and docs-out/. OUTPUT_DIR changes the output root.
