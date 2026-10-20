<h1 align="center">Visitor Management for Claude Code</h1>

<p align="center">
  <strong>The open-source visitor management system that is just a database and Claude Code.</strong>
</p>

<p align="center">
  Created by <a href="https://www.enterprisedna.co"><strong>Enterprise DNA</strong></a>. Free and open source. Works with Claude Code, Codex, OpenCode or Cursor.
</p>

<!-- three-doors -->
<table align="center">
  <tr>
    <td align="center"><strong>Do it yourself</strong><br/>Clone it, run it, own it. Free, MIT.<br/><a href="#quick-start">Quick start</a></td>
    <td align="center"><strong>We customise it</strong><br/>Your fields, your rules, your Envoy Visitors data brought across.<br/><a href="https://enterprisedna.co/omni/book/?utm_source=github&utm_medium=readme&utm_campaign=envoy-visitors">Book a call</a></td>
    <td align="center"><strong>We run it for you</strong><br/>Installed, connected and operated inside Omni. Setup fee, then a retainer.<br/><a href="https://enterprisedna.co/omni/instead-of/envoy-visitors?utm_source=github&utm_medium=readme&utm_campaign=envoy-visitors">How it works</a></td>
  </tr>
</table>

<p align="center">
  <a href="#what-is-this">What is this</a> &bull;
  <a href="#why-no-front-end">Why no front end</a> &bull;
  <a href="#quick-start">Quick start</a> &bull;
  <a href="#the-commands">Commands</a> &bull;
  <a href="#instead-of-envoy-visitors">Instead of Envoy Visitors</a> &bull;
  <a href="#want-it-installed-and-run-for-you">Installed for you</a> &bull;
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node-20+-339933?style=flat-square" alt="Node 20+" />
  <img src="https://img.shields.io/badge/PostgreSQL-any-336791?style=flat-square" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/PGlite-embedded-3ecf8e?style=flat-square" alt="PGlite" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT License" />
</p>

---

## What is this

A staffed reception desk in a database you own: expected visitors, host approvals, arrival and departure records, notice and induction evidence, retention decisions and local paperwork. The operator talks to Claude Code, Codex, OpenCode or Cursor. There is no unattended kiosk or access-control integration in the free base.

Envoy Visitors Premium lists at US$362 per location per month, billed annually. Five locations at that rate is US$21,720 a year before taxes or discounts. This is a list-price scenario, not a verified customer invoice. [Vendor pricing](https://envoy.com/pricing), checked 20 October 2026. [Envoy confirms billing in USD](https://envoy.help/en/articles/3330114-what-countries-is-envoy-available-in-can-we-purchase-your-hardware-internationally).

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/visitor-management-for-claude-code.git
cd visitor-management-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
```

Node 20 or later. Embedded PGlite runs without a database server. For PostgreSQL set DATABASE_URL before npm run migrate. Use a fresh database and imports for business records; npm run demo creates fictional data. DATA_DIR selects the embedded data directory. Keep credentials out of the repository.

## The commands

30 CLI commands and 34 slash recipes. Every CLI command has human output and --json. See [complete syntax](docs/cli.md).

- /sites: List sites and local policies.
- /hosts: List site hosts and availability.
- /visits: List visit history.
- /visit: Read a visit and event history.
- /arrivals: Prepare the next seven days of reception arrivals.
- /onsite: Read the current reception register.
- /attention: Reconcile overdue departures and missed arrivals.
- /approvals: Review visits awaiting a host decision.
- /retention-review: Review records due for a retention decision.
- /compliance: Review collection notice, induction and retention evidence.
- /activity: Read visit events.
- /insights: Answer ten cross-record questions.
- /add-site: Add a site and its policies.
- /add-host: Add a host at a site.
- /set-host: Mark a host available or unavailable.
- /invite: Register an expected visitor.
- /approve: Record a host approval.
- /deny: Record a declined visit.
- /acknowledge: Record evidence that the current notice and induction were provided.
- /check-in: Record arrival after approval and evidence checks.
- /check-out: Record a confirmed departure.
- /cancel: Cancel an expected visit.
- /hold: Place a retention hold.
- /release-hold: Release a reviewed retention hold.
- /redact: Redact identifying visit fields after a retention decision.
- /log: Record a reception follow-up event.
- /import: Import historical Envoy visitor records.
- /export: Export all business records locally.
- /weekly-review: Draft the weekly reception review.
- /draft-host: Draft a host review note without sending.
- /customise: add a field, change a policy or rename a stage.
- /new-view: add a read-only dashboard.
- /documents: render branded paperwork.
- /view: render read-only dashboards.

## Five weekly rituals

Prepare arrivals, clear host approvals, reconcile overdue departures, review notice and induction evidence, and make retention decisions. /weekly-review drafts the reception handover from arrivals, attention and compliance. Nothing sends.

## Ten questions to ask your records

Run /insights. These are implemented cross-record queries, not an unsupported claim that Envoy cannot build an equivalent report.

1. Which hosts have the most overdue departures?
2. Which sites have visitors without current notice evidence?
3. Which companies have visits across several sites?
4. Which hosts have arrivals waiting for approval?
5. Which historical records have passed our retention date?
6. Which visitors arrived without the current induction record?
7. Which expected visitors have an unavailable host?
8. How long do completed visits last at each site?
9. Which held records need a retention decision?
10. Which sites need the most work before the next reception handover?

## Your first hour: ten things to ask for

1. Put our name and logo on the paperwork.
2. Add our sites with the right timezones and policies.
3. Bring in our Envoy export with a dry run first.
4. Show historical visits separately from people here today.
5. List tomorrow's expected visitors by host.
6. Record this host's approval and the visitor's induction evidence.
7. Show which recorded departures need checking with staff.
8. Draft the weekly reception handover.
9. Add our visitor type field with /customise.
10. Add a site-specific review with /new-view.

## Instead of envoy-visitors

Export the visitor log as CSV and run one import per location. The import is atomic, repeatable and historical only. Retained source visit IDs are hashed; signed documents, photos and custom fields need a separate migration plan. [Switching guide](docs/replace-envoy-visitors.md).

## Evidence and retention

Check-in requires an approved visit, an active host and recorded evidence of the site's current notice and induction. The operator supplies a protected evidence reference. This is a record of an action, not an electronic signature service or proof that an induction was understood. Host labels and actor labels are not authenticated identities.

/compliance finds evidence gaps and records past the site's chosen retention date. The demo's 90 days is a local example policy, not a legal period. A hold or an onsite status blocks redaction. The retained event log records action codes and operator references. Local reports, exports, drafts and backups need their own disposal process. [Rules and sources](docs/compliance.md).

## Paperwork and dashboards

brand.json sets the business name, logo and colours. npm run docs creates arrival packs, visitor passes, visit histories and retention review sheets. npm run view creates the reception week, onsite register and evidence review. Files stay local. A pass does not grant physical access. Onsite records are a snapshot and are not an emergency accountability system.

## Why no front end

A reception operator can register a visit, record a decision and prepare the handover through the assistant. Unattended sign-in, mobile check-in, badge hardware and door integrations need a custom implementation. [The full boundary](docs/why-no-front-end.md).

## Verification

npm test uses a temporary database, covers every CLI operation and checks import rollback, repeated imports, dates, ambiguous names, arrival gates, redaction holds and generated documents. CI runs on Node 20 and 22 under Windows and Linux, plus PostgreSQL 16. CI results must be checked separately from local test output.

## Want it installed and run for you?

Omni by Enterprise DNA brings your history across, builds your fields, approval rules and reception screens, and runs your version. A different stack or hardware integration can be scoped with it. One setup fee, then a retainer.

[Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=envoy-visitors).

## License

MIT. Copyright (c) 2026 Enterprise DNA. Envoy is its owner's trademark. This independent project is not affiliated with Envoy.
