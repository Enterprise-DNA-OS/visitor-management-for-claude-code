# Visitor Management for Claude Code

## Who this is for

A staffed reception team managing expected visitors, host decisions, arrival and departure records across sites. The demo business is fictional Harbour Instruments. Replace its name and colours in brand.json before using real records.

## Rules

Read the records with the CLI before answering. Never infer a visitor is physically present from an old import. Never invent host approval, notice evidence or induction completion. Actor labels are not authentication. Use operator references and keep visitor personal details out of actor names, hold reasons and evidence references.

Do not send messages, publish a page, grant physical access or make payments. Drafts stay local. Before redaction or releasing a hold, show the exact record and obtain explicit approval in this session. Include generated copies and backups in the disposal plan. Emergency attendance follows the site emergency plan, not this database alone.

## Routes

| Job | Command |
|---|---|
| List sites and local policies | /sites |
| List site hosts and availability | /hosts |
| List visit history | /visits |
| Read a visit and event history | /visit |
| Prepare the next seven days of reception arrivals | /arrivals |
| Read the current reception register | /onsite |
| Reconcile overdue departures and missed arrivals | /attention |
| Review visits awaiting a host decision | /approvals |
| Review records due for a retention decision | /retention-review |
| Review collection notice, induction and retention evidence | /compliance |
| Read visit events | /activity |
| Answer ten cross-record questions | /insights |
| Add a site and its policies | /add-site |
| Add a host at a site | /add-host |
| Mark a host available or unavailable | /set-host |
| Register an expected visitor | /invite |
| Record a host approval | /approve |
| Record a declined visit | /deny |
| Record evidence that the current notice and induction were provided | /acknowledge |
| Record arrival after approval and evidence checks | /check-in |
| Record a confirmed departure | /check-out |
| Cancel an expected visit | /cancel |
| Place a retention hold | /hold |
| Release a reviewed retention hold | /release-hold |
| Redact identifying visit fields after a retention decision | /redact |
| Record a reception follow-up event | /log |
| Import historical Envoy visitor records | /import |
| Export all business records locally | /export |
| Draft the weekly reception review | /weekly-review |
| Draft a host review note without sending | /draft-host |
| Change a field or rule | /customise |
| Add a read-only view | /new-view |
| Render paperwork | /documents |
| Render dashboards | /view |

## Development

One CLI: scripts/visitors.mjs. Database: scripts/lib/db.mjs, embedded PGlite unless DATABASE_URL is set. New migrations go in supabase/migrations. Read docs/compliance.md and docs/replace-envoy-visitors.md. Run npm test after changes, then npm run demo, npm run docs and npm run view. Never seed a production database. All writes use parameterised queries; visit decisions run in transactions.

Built and operated through Omni by Enterprise DNA.
