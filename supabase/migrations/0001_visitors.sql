create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table sites (
 id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
 timezone text not null default 'Pacific/Auckland', retention_days integer not null default 90 check(retention_days between 1 and 3650),
 max_visit_hours integer not null default 12 check(max_visit_hours between 1 and 168),
 notice_version text not null, induction_version text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table hosts (
 id uuid primary key default gen_random_uuid(), site_id uuid not null references sites(id), name text not null,
 email text not null, active boolean not null default true, unique(site_id,email),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table visits (
 id uuid primary key default gen_random_uuid(), code text unique not null, site_id uuid not null references sites(id),
 host_id uuid references hosts(id), visitor_name text not null, email text not null default '', company text not null default '',
 purpose text not null, expected_at timestamptz not null, expected_end timestamptz not null,
 status text not null default 'pending' check(status in ('pending','approved','denied','onsite','departed','cancelled','historical','redacted')),
 checked_in_at timestamptz, checked_out_at timestamptz,
 approved_by text, approved_at timestamptz, notice_version text, notice_ack_at timestamptz,
 induction_version text, induction_at timestamptz, evidence_ref text,
 retention_due date not null, hold_reason text, source_key text unique, source text not null default 'local', imported_host text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(expected_end>expected_at), check(checked_out_at is null or (checked_in_at is not null and checked_out_at>=checked_in_at)),
 check(status<>'onsite' or (checked_in_at is not null and checked_out_at is null)),
 check(status<>'departed' or checked_out_at is not null)
);
create index visits_site_status on visits(site_id,status);
create index visits_retention on visits(retention_due);
create table visit_events (
 id uuid primary key default gen_random_uuid(), visit_id uuid not null references visits(id),
 event text not null, actor text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function immutable_event() returns trigger language plpgsql as $$ begin raise exception 'Visit events are append-only'; end $$;
create trigger event_immutable before update or delete on visit_events for each row execute function immutable_event();
create trigger sites_updated before update on sites for each row execute function touch_updated_at();
create trigger hosts_updated before update on hosts for each row execute function touch_updated_at();
create trigger visits_updated before update on visits for each row execute function touch_updated_at();
alter table sites enable row level security;
alter table hosts enable row level security;
alter table visits enable row level security;
alter table visit_events enable row level security;
revoke all on sites, hosts, visits, visit_events from public;
create view v_visit_register as
select v.id,v.code,s.code as site,v.visitor_name,v.company,coalesce(h.name,v.imported_host) as host,v.purpose,v.status,
v.expected_at,v.expected_end,v.checked_in_at,v.checked_out_at,v.retention_due,v.hold_reason,
v.source,v.notice_version,v.induction_version
from visits v join sites s on s.id=v.site_id left join hosts h on h.id=v.host_id;
create view v_arrivals as select * from v_visit_register where status in ('pending','approved') and expected_at < now()+interval '7 days';
create view v_onsite as select code,site,visitor_name,company,host,checked_in_at,expected_end,
round(extract(epoch from (now()-checked_in_at))/3600,1) as hours_here from v_visit_register where status='onsite';
create view v_attention as
select v.code,s.code as site,v.visitor_name,coalesce(h.name,'Unassigned') as host,v.status,
case when h.id is null or not h.active then 'Host unavailable'
 when v.status='onsite' then 'Departure overdue'
 when v.status='pending' then 'Host approval outstanding'
 when v.status='approved' then 'Expected arrival missed' else 'Host unavailable' end as reason
from visits v join sites s on s.id=v.site_id left join hosts h on h.id=v.host_id
where (v.status='onsite' and (v.expected_end<now() or v.checked_in_at<now()-s.max_visit_hours*interval '1 hour'))
or (v.status in ('pending','approved') and v.expected_at<now())
or (v.status in ('pending','approved','onsite') and (h.id is null or not h.active));
create view v_retention as
select code,site,visitor_name,status,retention_due,hold_reason,
case when hold_reason is not null then 'Review hold' when status='onsite' then 'Reconcile presence first' else 'Review for redaction' end as action
from v_visit_register where retention_due<=current_date and status<>'redacted';
create view v_compliance as
select v.code,s.code as site,'NOTICE' as rule,'Collection notice evidence missing or old' as finding
from visits v join sites s on s.id=v.site_id where v.status in ('onsite','departed','historical') and (v.notice_ack_at is null or v.notice_version is distinct from s.notice_version)
union all select v.code,s.code,'INDUCTION','Site induction evidence missing or old'
from visits v join sites s on s.id=v.site_id where v.status in ('onsite','departed','historical') and (v.induction_at is null or v.induction_version is distinct from s.induction_version)
union all select code,site,'RETENTION',action from v_retention
union all select v.code,s.code,'HOST','Active visit has no available host'
from visits v join sites s on s.id=v.site_id left join hosts h on h.id=v.host_id
where v.status in ('pending','approved','onsite') and (h.id is null or not h.active);
