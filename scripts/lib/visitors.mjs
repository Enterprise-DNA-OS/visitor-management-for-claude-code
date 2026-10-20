import { randomUUID, createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './db.mjs';
import { parseCsv, pick } from './csv.mjs';

export const READS = {
 sites:'select code,name,timezone,retention_days,max_visit_hours,notice_version,induction_version from sites order by code',
 hosts:'select h.id,s.code as site,h.name,h.email,h.active from hosts h join sites s on s.id=h.site_id order by site,h.name',
 visits:'select * from v_visit_register order by expected_at desc,code',
 arrivals:'select code,site,visitor_name,host,expected_at,status from v_arrivals order by expected_at,code',
 onsite:'select * from v_onsite order by checked_in_at,code',
 attention:'select * from v_attention order by site,code',
 approvals:"select code,site,visitor_name,host,expected_at from v_visit_register where status='pending' order by expected_at,code",
 'retention-review':'select * from v_retention order by retention_due,code',
 compliance:'select * from v_compliance order by site,code,rule',
 activity:'select v.code,e.event,e.actor,e.created_at from visit_events e join visits v on v.id=e.visit_id order by e.created_at,e.id',
};
export const QUESTIONS = [
 ['Which hosts have the most overdue departures?',"select host,count(*) as overdue from v_attention where reason='Departure overdue' group by host order by overdue desc,host"],
 ['Which sites have visitors without current notice evidence?',"select site,count(*) as missing_notice from v_compliance where rule='NOTICE' group by site order by site"],
 ['Which companies have visits across several sites?',"select company,count(distinct site) as sites,count(*) as visits from v_visit_register where company<>'' group by company having count(distinct site)>1 order by sites desc,company"],
 ['Which hosts have arrivals waiting for approval?',"select host,count(*) as waiting from v_visit_register where status='pending' group by host order by waiting desc,host"],
 ['Which historical records have passed our retention date?',"select code,site,visitor_name,retention_due,hold_reason from v_retention where status='historical' order by retention_due,code"],
 ['Which visitors arrived without the current induction record?',"select code,site from v_compliance where rule='INDUCTION' order by site,code"],
 ['Which expected visitors have an unavailable host?',"select code,site from v_compliance where rule='HOST' order by site,code"],
 ['How long do completed visits last at each site?',"select site,round(avg(extract(epoch from (checked_out_at-checked_in_at))/60),1) as average_minutes,count(*) as completed from v_visit_register where checked_out_at is not null group by site order by site"],
 ['Which held records need a retention decision?',"select code,site,retention_due,hold_reason from v_retention where hold_reason is not null order by retention_due,code"],
 ['Which sites need the most work before the next reception handover?',"select site,count(*) as issues,count(distinct code) as visits from v_attention group by site order by issues desc,site"],
];
const TABLES=['sites','hosts','visits','visit_events'];
export function required(o,k) {if(typeof o[k]!=='string'||!o[k].trim()) throw Error(`Required --${k}=value`);return o[k].trim();}
function integer(v,min,max,label) {const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw Error(`${label} must be an integer ${min}..${max}`);return n;}
export function timestamp(v, offset='') {
 let s=String(v||'').trim();
 if(!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?$/.test(s))throw Error(`Use an ISO date and time with a UTC offset: ${s}`);
 s=s.replace(' ','T');
 if(!/(Z|[+-]\d{2}:\d{2})$/.test(s)) {if(!/^[+-](0\d|1[0-4]):[0-5]\d$/.test(offset))throw Error('Unzoned timestamp: supply --offset=+13:00 for this export, or use zoned ISO values');s+=offset;}
 const day=s.slice(0,10);const d=new Date(day+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==day)throw Error('Invalid calendar date');
 const result=new Date(s);if(!Number.isFinite(result.getTime())||Number(s.slice(11,13))>23||Number(s.slice(14,16))>59||Number(s.slice(17,19))>59)throw Error('Invalid timestamp');return result.toISOString();
}
function dateAfter(time,days) {return new Date(new Date(time).getTime()+days*86400000).toISOString().slice(0,10);}
export async function resolve(db,table,needle,lock=false) {
 if(!['sites','hosts','visits'].includes(table))throw Error('Unknown record type');
 const column=table==='visits'?'visitor_name':'name';
 const code=table==='hosts'?'email':'code';
 if(!needle)throw Error(`Supply ${table} ID, code or name`);
 const rows=await db.query(`select * from ${table} where lower(${code})=lower($1) or id::text=$1 order by id${lock?' for update':''}`,[needle]);
 if(rows.length===1)return rows[0];
 const matches=rows.length?rows:await db.query(`select * from ${table} where starts_with(lower(id::text),lower($1)) or strpos(lower(${column}),lower($1))>0 order by id${lock?' for update':''}`,[needle]);
 if(matches.length!==1)throw Error(matches.length?`Ambiguous ${table}:\n${matches.map(x=>`${x.id}  ${x[code]}  ${x[column]}`).join('\n')}`:`No ${table} match: ${needle}`);
 return matches[0];
}
async function event(db,id,name,actor) {await db.query('insert into visit_events(visit_id,event,actor) values($1,$2,$3)',[id,name,actor]);}
async function tx(db,fn,dry=false) {await db.exec('BEGIN');try{const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return result;}catch(e){await db.exec('ROLLBACK');throw e;}}
function writePrivate(dir,name,text) {const root=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,dir);mkdirSync(root,{recursive:true,mode:0o700});const out=path.join(root,name);writeFileSync(out,text,{mode:0o600,flag:'wx'});return out;}
async function visitDetail(db,needle,lock=false) {const v=await resolve(db,'visits',needle,lock);const history=await db.query('select event,actor,created_at from visit_events where visit_id=$1 order by created_at,id',[v.id]);return {visit:v,history};}

export async function run(db,command,args=[],o={}) {
 if(READS[command])return db.query(READS[command]);
 if(command==='visit')return visitDetail(db,args[0]);
 if(command==='insights') {const out=[];for(const [question,sql] of QUESTIONS)out.push({question,rows:await db.query(sql)});return out;}
 if(command==='export') {await db.exec('BEGIN READ ONLY');try {const data={version:1,exported_at:new Date().toISOString()};for(const t of TABLES)data[t]=await db.query(`select * from ${t} order by id`);return {file:writePrivate('exports',`visitors-${randomUUID()}.json`,JSON.stringify(data,null,2)+'\n'),counts:Object.fromEntries(TABLES.map(t=>[t,data[t].length]))};}finally {await db.exec('ROLLBACK');}}
 if(command==='weekly-review') {let text='# Reception weekly review\n\nGenerated '+new Date().toISOString()+'\n';for(const c of ['arrivals','attention','compliance'])text+=`\n## ${c}\n\n`+JSON.stringify(await run(db,c),null,2)+'\n';return {file:writePrivate('drafts',`weekly-${randomUUID()}.md`,text)};}
 if(command==='draft-host') {const {visit:v}=await visitDetail(db,args[0]);return {file:writePrivate('drafts',`host-${v.code}-${randomUUID()}.md`,`# Host review draft\n\nVisitor: ${v.visitor_name}\nPurpose: ${v.purpose}\nExpected: ${new Date(v.expected_at).toISOString()}\nStatus: ${v.status}\n\nPlease review the visit record before arrival. This draft has not been sent.\n`)};}
 if(command==='import') {if(args[0]!=='envoy')throw Error('Use import envoy <export.csv> --site=CODE');return importEnvoy(db,args[1],o);}
 const actor=required(o,'actor');
 return tx(db,async()=>{
  if(command==='add-site') {const code=required(o,'code');if(!/^[A-Za-z0-9-]+$/.test(code))throw Error('Site code needs letters, digits and hyphens');const zone=required(o,'timezone');new Intl.DateTimeFormat('en',{timeZone:zone});return db.query('insert into sites(code,name,timezone,retention_days,max_visit_hours,notice_version,induction_version) values($1,$2,$3,$4,$5,$6,$7) returning code,name',[code,required(o,'name'),zone,integer(o['retention-days']||90,1,3650,'retention days'),integer(o['max-hours']||12,1,168,'max hours'),required(o,'notice'),required(o,'induction')]);}
  if(command==='add-host') {const s=await resolve(db,'sites',required(o,'site'));const email=required(o,'email');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid email');return db.query('insert into hosts(site_id,name,email) values($1,$2,$3) returning id,name,email',[s.id,required(o,'name'),email.toLowerCase()]);}
  if(command==='set-host') {if(!['true','false'].includes(o.active))throw Error('Use --active=true|false');const h=await resolve(db,'hosts',args[0],true);return db.query('update hosts set active=$2 where id=$1 returning id,name,active',[h.id,o.active==='true']);}
  if(command==='invite') {const s=await resolve(db,'sites',required(o,'site'));const h=await resolve(db,'hosts',required(o,'host'));if(h.site_id!==s.id||!h.active)throw Error('Host must be active at the selected site');const start=timestamp(required(o,'at')),end=timestamp(required(o,'until'));if(end<=start)throw Error('End must be after start');const [v]=await db.query('insert into visits(code,site_id,host_id,visitor_name,email,company,purpose,expected_at,expected_end,retention_due) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *',[`VIS-${randomUUID().slice(0,8).toUpperCase()}`,s.id,h.id,required(o,'name'),o.email||'',o.company||'',required(o,'purpose'),start,end,dateAfter(end,s.retention_days)]);await event(db,v.id,'invited',actor);return [v];}
  const v=await resolve(db,'visits',args[0],true);
  if(v.status==='redacted')throw Error('Redacted visit is closed');
  if(command==='approve'||command==='deny') {if(v.status!=='pending')throw Error('Only pending visits can be decided');const h=await resolve(db,'hosts',v.host_id);if(!h.active)throw Error('Host is inactive');if(command==='approve')await db.query("update visits set status='approved',approved_by=$2,approved_at=now() where id=$1",[v.id,actor]);else await db.query("update visits set status='denied' where id=$1",[v.id]);}
  else if(command==='acknowledge') {if(!['pending','approved','onsite'].includes(v.status))throw Error('Only current visits accept evidence');const s=await resolve(db,'sites',v.site_id);if(required(o,'notice')!==s.notice_version||required(o,'induction')!==s.induction_version)throw Error('Evidence must name current site notice and induction versions');await db.query('update visits set notice_version=$2,notice_ack_at=now(),induction_version=$3,induction_at=now(),evidence_ref=$4 where id=$1',[v.id,s.notice_version,s.induction_version,required(o,'evidence')]);}
  else if(command==='check-in') {if(v.status!=='approved')throw Error('Host approval required before check-in');const s=await resolve(db,'sites',v.site_id);const h=await resolve(db,'hosts',v.host_id);if(!h.active)throw Error('Host is inactive');if(v.notice_version!==s.notice_version||v.induction_version!==s.induction_version||!v.evidence_ref)throw Error('Current notice and induction evidence required');if(new Date(v.expected_end)<=new Date())throw Error('Visit window has ended; create a new visit');await db.query("update visits set status='onsite',checked_in_at=now() where id=$1",[v.id]);}
  else if(command==='check-out') {if(v.status!=='onsite')throw Error('Only onsite visits can be signed out');const s=await resolve(db,'sites',v.site_id);await db.query("update visits set status='departed',checked_out_at=now(),retention_due=current_date+$2::integer where id=$1",[v.id,s.retention_days]);}
  else if(command==='cancel') {if(!['pending','approved'].includes(v.status))throw Error('Only pending or approved visits can be cancelled');await db.query("update visits set status='cancelled' where id=$1",[v.id]);}
  else if(command==='hold')await db.query('update visits set hold_reason=$2 where id=$1',[v.id,required(o,'reason')]);
  else if(command==='release-hold') {if(o.confirm!==true)throw Error('Review the hold and supply --confirm');await db.query('update visits set hold_reason=null where id=$1',[v.id]);}
  else if(command==='redact') {if(o.confirm!==true)throw Error('Explicit --confirm required');if(v.hold_reason||v.status==='onsite'||v.retention_due>new Date().toISOString().slice(0,10))throw Error('Cannot redact: hold, presence or retention period outstanding');await db.query("update visits set visitor_name='[redacted]',email='',company='',purpose='[redacted]',evidence_ref=null,hold_reason=null,status='redacted' where id=$1",[v.id]);}
  else if(command==='log') {if(!['host-contacted','arrival-reviewed','departure-reconciled','retention-reviewed'].includes(o.code))throw Error('Use a documented event code');await event(db,v.id,o.code,actor);return [{code:v.code,event:o.code}];}
  else throw Error(`Unknown command: ${command}`);
  await event(db,v.id,command,actor);return db.query('select code,status,visitor_name from visits where id=$1',[v.id]);
 });
}

async function importEnvoy(db,file,o) {
 if(!file)throw Error('Supply an Envoy CSV export');
 const site=await resolve(db,'sites',required(o,'site'));
 const rows=parseCsv(readFileSync(file,'utf8'));
 const mapping=o.mapping?JSON.parse(readFileSync(o.mapping,'utf8')):{};
 const mapped=(row,key,...aliases)=>mapping[key]?pick(row,mapping[key]):pick(row,...aliases);
 const prepared=rows.map((r,i)=>{
  const name=mapped(r,'name','Full name','Your full name','Name').trim();
  const start=timestamp(mapped(r,'in','Sign-in time','Signed in at','Signed In At'),o.offset||'');
  const out=mapped(r,'out','Sign-out time','Signed out at','Signed Out At');const end=out?timestamp(out,o.offset||''):null;
  if(!name)throw Error(`Row ${i+2}: full name required`);if(end&&end<start)throw Error(`Row ${i+2}: sign-out precedes sign-in`);
  const email=mapped(r,'email','E-mail','Email','Email address').trim().toLowerCase();
  const external=mapped(r,'id','Entry ID','EntryId','ID');
  const key=createHash('sha256').update(JSON.stringify([site.id,external||[name,email,start]])).digest('hex');
  return {name,start,end,email,key,company:mapped(r,'company','Company name','Company'),purpose:mapped(r,'purpose','Purpose of visit','Purpose')||'Imported visit',host:mapped(r,'host','Host name','Host'),hostEmail:mapped(r,'hostEmail','Host email address','Host email').trim().toLowerCase()};
 });
 if(new Set(prepared.map(r=>r.key)).size!==prepared.length)throw Error('Duplicate visits in CSV; split or correct before importing');
 return tx(db,async()=>{let inserted=0,unchanged=0;for(const r of prepared){
  const old=await db.query('select * from visits where source_key=$1',[r.key]);if(old.length){const v=old[0];if(v.status==='redacted'){unchanged++;continue;}if(v.visitor_name!==r.name||v.email!==r.email||v.company!==r.company||v.purpose!==r.purpose||new Date(v.checked_in_at).toISOString()!==r.start||(v.checked_out_at?new Date(v.checked_out_at).toISOString():null)!==r.end)throw Error('Existing imported visit differs; reconcile instead of overwriting history');unchanged++;continue;}
  const hs=r.hostEmail?await db.query('select id from hosts where site_id=$1 and lower(email)=lower($2)',[site.id,r.hostEmail]):await db.query('select id from hosts where site_id=$1 and lower(name)=lower($2)',[site.id,r.host]);
  if(hs.length>1)throw Error('Ambiguous imported host: include Host email address');
  const [v]=await db.query("insert into visits(code,site_id,host_id,visitor_name,email,company,purpose,expected_at,expected_end,status,checked_in_at,checked_out_at,retention_due,source_key,source,imported_host) values($1,$2,$3,$4,$5,$6,$7,$8,$9,'historical',$8,$10,$11,$12,'envoy',$13) returning id",[`ENV-${r.key.slice(0,12).toUpperCase()}`,site.id,hs[0]?.id||null,r.name,r.email,r.company,r.purpose,r.start,r.end&&r.end>r.start?r.end:new Date(new Date(r.start).getTime()+3600000).toISOString(),r.end,dateAfter(r.end||r.start,site.retention_days),r.key,r.host||null]);
  await event(db,v.id,'imported-history',o.actor||'import');inserted++;
 }return {dry_run:o['dry-run']===true,inserted,unchanged,historical_only:true};},o['dry-run']===true);
}
