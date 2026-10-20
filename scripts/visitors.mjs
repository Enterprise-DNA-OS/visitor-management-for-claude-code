#!/usr/bin/env node
import { getDb } from './lib/db.mjs';
import { run, READS } from './lib/visitors.mjs';
import { table } from './lib/format.mjs';
export const COMMANDS=[...Object.keys(READS),'visit','insights','add-site','add-host','set-host','invite','approve','deny','acknowledge','check-in','check-out','cancel','hold','release-hold','redact','log','import','export','weekly-review','draft-host'];
const raw=process.argv.slice(2),options={},pos=[];
for(const a of raw) {if(a.startsWith('--')){const i=a.indexOf('=');options[a.slice(2,i<0?undefined:i)]=i<0?true:a.slice(i+1);}else pos.push(a);}
const [command,...args]=pos;
function human(v) {if(Array.isArray(v)){if(!v.length)return '(none)';if(v[0]?.question)return v.map(x=>x.question+'\n'+human(x.rows)).join('\n\n');return table(v,Object.keys(v[0]).map(k=>({key:k,label:k,format:x=>x instanceof Date?x.toISOString():x&&typeof x==='object'?JSON.stringify(x):x})));}return JSON.stringify(v,null,2);}
if(!command||options.help){console.log('Visitor Management for Claude Code\n'+COMMANDS.join('\n')+'\nUse --json for machine output. See docs/cli.md for arguments.');}
else if(!COMMANDS.includes(command)){console.error('Unknown command: '+command);process.exitCode=1;}
else {let db;try{db=await getDb();const result=await run(db,command,args,options);console.log(options.json?JSON.stringify(result,null,2):human(result));}catch(e){if(options.json)console.error(JSON.stringify({error:e.message}));else console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
