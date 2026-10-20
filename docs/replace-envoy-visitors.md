# Move from Envoy Visitors

Source checked 20 October 2026: [Envoy export help](https://envoy.help/en/articles/4951833-exporting-visitor-data).

In Envoy, open Visitors > Visitor log, choose Export, the date range and visitor flows, then CSV. Include identity, host and arrival/departure fields. Export each location separately. Keep signed documents in protected storage for separate migration.

Create each site and host with the CLI, then run:

```bash
node scripts/visitors.mjs import envoy imports/visitors.csv --site=AKL --offset=+13:00 --dry-run --actor=operator
node scripts/visitors.mjs import envoy imports/visitors.csv --site=AKL --offset=+13:00 --actor=operator
```

Use the correct offset for the exported timestamps. Split files spanning a daylight-saving change or normalise each timestamp to a zoned ISO value. Ambiguous locale dates are rejected; convert them to ISO before import. Do not guess the timezone from this example.

## Mapping

| CSV field | Record |
|---|---|
| Full name / Your full name / Name | Visitor name |
| E-mail / Email / Email address | Email |
| Company name / Company | Company |
| Purpose of visit / Purpose | Purpose |
| Sign-in time / Signed in at | Arrival timestamp |
| Sign-out time / Signed out at | Departure timestamp, nullable |
| Host name / Host | Existing host or retained imported host label |
| Host email address / Host email | Host matching within the chosen site |
| Entry ID / EntryId / ID | Stable identity if present |

Header names depend on selected export fields. Use --mapping=imports/mapping.json for other headers, for example {"name":"Visitor","in":"Arrived","out":"Departed"}. The fixture in tests/fixtures is synthetic, based on documented field labels; it is not an export supplied by Envoy.

Each file imports atomically. A repeat skips unchanged records. Changed records fail and need explicit reconciliation; they never silently overwrite history. Without an entry ID, the site, name, email and arrival time identify a row. Corrected identity fields can create a new record, so compare counts before accepting the import. Blank files import zero rows. Duplicate identities fail. Extra columns are ignored and never imported implicitly.

All imported visits are historical, including missing sign-outs. They never appear on the current onsite register. Recorded legal-document flags do not prove current notice or induction completion. Photos, signatures, notifications, access permissions, custom fields and scheduled invitations are not imported. Scope these separately. The one-hour expected window on an unsigned-out historical visit is a placeholder for sorting, not an asserted departure.

## Reconcile before switching

Compare record counts by site and date. Sample names, hosts and timestamps against the old system. Resolve unmatched hosts and missing departure times. Run compliance and retention-review, then test a new invitation through approval, evidence, check-in and check-out. Confirm the staffed reception process and any separately built kiosk or door integration before stopping the old service.

Export creates a versioned JSON copy of sites, hosts, visits and action history in exports/. Treat it as personal information. Keep a database backup as well; this base does not restore its JSON export automatically.
