'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const lso = require('./src');
const VERSION = require('./package.json').version;
const SCHEMA = 1;
const CONFIG = 'lso.config.json';
const TEMPLATE = path.join(__dirname, 'templates', 'v2', 'minimal');
const EXIT = {OK: 0, DEGRADED: 1, USAGE: 2, ERROR: 3};
const MESSAGE = {
  REQUIRED_SOURCES: 'Required project files are missing.', IDENTITY_CONTINUITY: 'Project identity or protocol fields do not agree.',
  ACTIVE_TASK: 'The active Task declared in STATUS.md is missing.', CONTINUITY: 'Optional continuity directories are missing.',
  CORPUS_ABSENT: 'Project Corpus V2 has not been initialized.', CONFIG_INVALID: 'LSO configuration is invalid.'
};
function fail(code, message) { const e = new Error(message); e.code = code; throw e; }
function sha(value) { return crypto.createHash('sha256').update(Buffer.isBuffer(value) || typeof value === 'string' ? value : JSON.stringify(value)).digest('hex'); }
function json(value) { return JSON.stringify(value, null, 2) + '\n'; }
function safeId(s) { return typeof s === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(s); }
function within(root, target) { const rel = path.relative(root, target); return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel)); }
function assertNoLinks(root, target) {
  if (!within(root, target)) fail('UNSAFE_PATH', 'Resolved path escapes project root.');
  let cur = root;
  const rel = path.relative(root, target);
  for (const part of rel.split(path.sep).filter(Boolean)) {
    cur = path.join(cur, part);
    try { if (fs.lstatSync(cur).isSymbolicLink()) fail('LINK_REJECTED', 'Symlink/reparse path is not accepted.'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
}
function resolveRoot(arg) {
  const root = path.resolve(arg || process.cwd());
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) fail('ROOT_REQUIRED', 'Project path must be an existing directory.');
  const real = fs.realpathSync(root);
  if (real !== root) fail('ROOT_LINK', 'Project root must not resolve through a symlink.');
  return root;
}
function projectMetadata(root) {
  const result = {git: false, packageJson: false, testCommand: null};
  try { result.git = fs.statSync(path.join(root, '.git')).isDirectory() || fs.statSync(path.join(root, '.git')).isFile(); } catch {}
  try { const p = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')); result.packageJson = true; result.testCommand = p.scripts && p.scripts.test || null; } catch {}
  return result;
}
function configPath(root) { return path.join(root, CONFIG); }
function loadConfig(root, optional = false) {
  const file = configPath(root); assertNoLinks(root, file);
  if (!fs.existsSync(file)) { if (optional) return null; fail('CONFIG_MISSING', 'lso.config.json is missing; run lso init.'); }
  let c; try { c = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { fail('CONFIG_INVALID', 'lso.config.json is not valid JSON.'); }
  validateConfig(c); return c;
}
function validateConfig(c) {
  const allowed = ['schemaVersion','projectId','adapter','runtime','recovery'];
  if (!c || typeof c !== 'object' || Array.isArray(c) || Object.keys(c).some(k => !allowed.includes(k))) fail('CONFIG_INVALID', 'Unknown or invalid configuration fields.');
  if (c.schemaVersion !== SCHEMA || !safeId(c.projectId) || c.adapter !== 'project-corpus-v2' || typeof c.runtime !== 'string' || c.runtime !== '.lso-runtime') fail('CONFIG_INVALID', 'Configuration schema, project ID, adapter, or runtime is unsupported.');
  if (c.recovery !== undefined) {
    if (!c.recovery || typeof c.recovery !== 'object' || Array.isArray(c.recovery) || Object.keys(c.recovery).some(k => !['dependencies','origin'].includes(k))) fail('CONFIG_INVALID', 'Unknown recovery configuration field.');
    if (c.recovery.dependencies !== undefined && (!Array.isArray(c.recovery.dependencies) || c.recovery.dependencies.length > 128 || c.recovery.dependencies.some(d => !d || typeof d !== 'object' || Object.keys(d).some(k => !['id','class','required','note','path','constraint'].includes(k)) || !safeId(d.id) || !['source/git','runtime/toolchain','package-lockfile','environment-presence','external-service','durable-data'].includes(d.class) || typeof d.required !== 'boolean' || Object.values(d).some(v => typeof v === 'string' && /(?:password|secret|token|api[_-]?key)\s*[:=]\s*\S+|-----BEGIN .*PRIVATE KEY-----/i.test(v))))) fail('CONFIG_INVALID', 'Recovery dependencies contain unsupported fields or secret-like values.');
    if (c.recovery.origin !== undefined) {
      const o = c.recovery.origin;
      if (!o || Object.keys(o).some(k => !['type','remote','commit','files'].includes(k)) || o.type !== 'git' || !validRemote(o.remote) || !/^[a-f0-9]{40}$/.test(o.commit) || !Array.isArray(o.files) || o.files.length < 1 || o.files.length > 256 || new Set(o.files).size !== o.files.length || o.files.some(x => typeof x !== 'string')) fail('CONFIG_INVALID', 'Git origin requires explicit credential-free URL, exact commit and file list.');
      for (const f of o.files) safeRepoPath(f);
    }
  }
  return c;
}
function validRemote(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\r\n\0]/.test(value) || /(?:^|\/\/)[^/@]+:[^/@]+@/.test(value)) return false;
  return /^file:\/\/\/(?:[A-Za-z]:\/)?[A-Za-z0-9._/-]+(?:\.git)?$/.test(value) || /^https:\/\/[A-Za-z0-9.-]+(?::[0-9]+)?\/[A-Za-z0-9._/-]+(?:\.git)?$/.test(value) || /^ssh:\/\/[A-Za-z0-9._-]+@[A-Za-z0-9.-]+(?::[0-9]+)?\/[A-Za-z0-9._/-]+(?:\.git)?$/.test(value) || /^git@[A-Za-z0-9.-]+:[A-Za-z0-9._/-]+(?:\.git)?$/.test(value);
}
function safeRepoPath(ref) {
  if (typeof ref !== 'string' || !ref || ref.startsWith('/') || ref.includes('\\') || ref.includes(':') || ref.split('/').some(x => !x || x === '.' || x === '..')) fail('UNSAFE_PATH', 'Unsafe repository-relative path.');
}
function context(root, c) { return lso.createContext({root, projectId: c.projectId, runtime: c.runtime, adapter: lso.projectCorpusAdapter()}); }
function options(args) { return {json: args.includes('--json'), yes: args.includes('--yes'), dry: args.includes('--dry-run')}; }
function init(root, opt) {
  const meta = projectMetadata(root); const existingConfig = configPath(root); assertNoLinks(root, existingConfig);
  const corpus = ['AGENTS.md','.project-corpus/state/PROJECT.md','.project-corpus/state/STATUS.md','.project-corpus/policy.toml'].some(f => fs.existsSync(path.join(root,f))) || fs.existsSync(path.join(root,'.project-corpus'));
  const allCorpus = ['AGENTS.md','.project-corpus/state/PROJECT.md','.project-corpus/state/STATUS.md','.project-corpus/policy.toml'].every(f => fs.existsSync(path.join(root,f)));
  if (corpus && !allCorpus) fail('CORPUS_INCOMPATIBLE', 'Existing partial/incompatible Corpus state; refusing to overwrite.');
  const projectId = allCorpus ? extract(fs.readFileSync(path.join(root,'.project-corpus/state/PROJECT.md'),'utf8'),'Project-ID') : slug(path.basename(root));
  if (!safeId(projectId)) fail('PROJECT_ID_INVALID', 'Existing project ID is invalid.');
  if (allCorpus) {
    const pc=fs.readFileSync(path.join(root,'.project-corpus/policy.toml'),'utf8');
    const status=fs.readFileSync(path.join(root,'.project-corpus/state/STATUS.md'),'utf8');
    if (extract(status,'Project-ID') !== projectId || extract(status,'Protocol-Version') !== '2.0' || !pc.includes(`project_id = "${projectId}"`) || !pc.includes('policy_version = "2.0"') || extract(fs.readFileSync(path.join(root,'.project-corpus/state/PROJECT.md'),'utf8'),'Protocol-Version') !== '2.0') fail('CORPUS_INCOMPATIBLE','Existing Corpus identity/policy does not agree with supported V2.');
  }
  const planned = [];
  if (!allCorpus) for (const rel of ['AGENTS.md','.project-corpus/state/PROJECT.md','.project-corpus/state/STATUS.md','.project-corpus/policy.toml']) planned.push(rel);
  for (const rel of ['.project-corpus/tasks','.project-corpus/reports','.project-corpus/history']) if (!fs.existsSync(path.join(root,rel))) planned.push(rel);
  const c = {schemaVersion:1,projectId,adapter:'project-corpus-v2',runtime:'.lso-runtime',recovery:{dependencies:[]}};
  if (!fs.existsSync(existingConfig)) planned.push(CONFIG);
  else {
    let existing; try { existing=JSON.parse(fs.readFileSync(existingConfig,'utf8')); } catch { fail('CONFIG_INVALID','Existing lso.config.json is not valid JSON.'); }
    validateConfig(existing);
    if (existing.projectId !== projectId) fail('CONFIG_BINDING_MISMATCH','Existing config is bound to another project.');
  }
  const plan={schemaVersion:1,projectId,root,detected:{git:meta.git,projectCorpusV2:allCorpus,packageJson:meta.packageJson,testCommand:meta.testCommand},create:planned.sort(),willNotModify:['source files','Git history','dependencies','external services'],dryRun:opt.dry};
  if (opt.dry || (!opt.yes && (opt.json || !confirm(plan)))) return {...plan,result:'NOT_APPLIED'};
  if (opt.yes) process.stderr.write(renderInit(plan));
  if (!opt.yes && !opt.json) return {...plan,result:'NOT_APPLIED'};
  const writes=[];
  try {
    if (!allCorpus) {
      for (const rel of ['AGENTS.md','.project-corpus/state/PROJECT.md','.project-corpus/state/STATUS.md','.project-corpus/policy.toml']) {
        const dst=path.join(root,rel); if (fs.existsSync(dst)) fail('CANONICAL_EXISTS','Refusing to overwrite '+rel);
        const src=path.join(TEMPLATE,rel); let body=fs.readFileSync(src,'utf8');
        body=body.replaceAll('example-project',projectId).replaceAll('Example Project',path.basename(root));
        writes.push([dst,body]);
      }
    }
    if (!fs.existsSync(existingConfig)) writes.push([existingConfig,json(c)]);
    for (const [dst,body] of writes) { assertNoLinks(root,dst); fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.writeFileSync(dst,body,{flag:'wx'}); }
    for (const rel of ['.project-corpus/tasks','.project-corpus/reports','.project-corpus/history']) {
      const dir=path.join(root,rel); assertNoLinks(root,dir); fs.mkdirSync(dir,{recursive:true});
    }
  } catch (e) { throw e; }
  return {...plan,result:'INITIALIZED',created:writes.map(([p])=>path.relative(root,p).replaceAll('\\','/')).sort()};
}
function confirm(plan) {
  process.stdout.write(renderInit(plan));
  if (!process.stdin.isTTY) return false;
  process.stderr.write('Create exactly these files/directories? [y/N] ');
  const bytes = Buffer.alloc(16);
  const n = fs.readSync(0, bytes, 0, bytes.length, null);
  return /^y(?:es)?$/i.test(bytes.subarray(0, n).toString('utf8').trim());
}
function extract(text,key) { const m=text.match(new RegExp('^'+key+':\\s*(.+)$','m')); return m&&m[1].trim(); }
function slug(s) { return (s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^[^A-Za-z0-9]+/,'').slice(0,128) || 'project'); }
function humanize(s) { return s.replace(/[-_.]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
function assess(root) {
  const c=loadConfig(root,true);
  if (!c) return {config:null,health:{state:'UNHEALTHY',findings:[{id:'CORPUS_ABSENT',severity:'FAIL'}]},manifest:null,ctx:null};
  const ctx=context(root,c); return {config:c,ctx,health:lso.homeostasis.inspect(ctx),manifest:lso.recovery.buildManifest(ctx)};
}
function doctor(root) {
  const a=assess(root); const health=a.health; const manifest=a.manifest;
  const findings=health.findings.map(f=>({id:f.id,code:f.id,severity:f.severity,state:f.severity==='PASS'?'CURRENT':'OBSERVED',summary:MESSAGE[f.id]||f.summary,evidence:f.detail||null,nextAction:f.severity==='PASS'?'None.':`Review ${f.id} in project-owned authority; no change is made.`,repair:'PROPOSAL_ONLY'}));
  const status=health.state==='STABLE'?'HEALTHY':health.state;
  const readiness=manifest?manifest.readiness.canonical_substrate:'NOT_READY';
  return {schemaVersion:1,productVersion:VERSION,architecture:'v0.1-v0.7',project:{id:a.config?.projectId||null,root},identity:health.state==='STABLE'?'HEALTHY':health.findings.find(x=>x.id==='IDENTITY_CONTINUITY')?.severity==='PASS'?'HEALTHY':'DEGRADED',continuity:health.findings.find(x=>x.id==='CONTINUITY')?.severity==='PASS'?'HEALTHY':'DEGRADED',homeostasis:health.state,recovery:readiness,readiness, reacquisition:'UNPROVEN',phenotype:'UNVERIFIED',findings,summary:{health:status,readiness},authority:health.authority,changed:false,raw:{health,manifest}};
}
function status(root) {
  const a=assess(root); return {schemaVersion:1,projectId:a.config?.projectId||null,protocolAgreement:a.manifest?.identity.corpus_agreement===true && a.manifest?.identity.policy_agreement===true,lifecycle:a.manifest?.identity.lifecycle||'UNKNOWN',homeostasis:a.health.state,recovery:a.manifest?.readiness.canonical_substrate||'NOT_READY',latestHistory:null,mutation:false};
}
function contextView(root) {
  const d=doctor(root); const c=d.project.id; const files=['AGENTS.md','.project-corpus/state/PROJECT.md','.project-corpus/state/STATUS.md','.project-corpus/policy.toml'];
  const active=d.raw.manifest?.identity.activeTaskId; if(active && active!=='NONE' && safeId(active)) files.push(`.project-corpus/tasks/${active}.md`);
  const inventory=files.map(ref=>{const p=path.join(root,ref);return {path:ref,present:fs.existsSync(p),sha256:fs.existsSync(p)?sha(fs.readFileSync(p)):null};});
  return {schemaVersion:1,kind:'lso_agent_context',project:{id:c,root},authorityPointers:{agents:'AGENTS.md',project:'.project-corpus/state/PROJECT.md',status:'.project-corpus/state/STATUS.md',policy:'.project-corpus/policy.toml',activeTask:d.raw.manifest?.identity.activeTaskId||null},fingerprints:{genome:d.raw.health.fingerprints.genomeSha256,status:d.raw.health.fingerprints.statusSha256},health:{homeostasis:d.homeostasis,recovery:d.recovery,readiness:d.readiness},findings:d.findings,evidenceSources:inventory,warnings:['Evidence only; not project authority.','Read project-owned mandatory authority before acting.','No repair, restore, write, or execution authority is granted.']};
}
function findings(root) { return doctor(root).findings; }
function deps(root) { return loadConfig(root,true)?.recovery?.dependencies||[]; }
function originVerify(root, args) {
  const cfg=loadConfig(root); const origin=cfg.recovery?.origin;
  const remote=argValue(args,'--remote')||origin?.remote, commit=argValue(args,'--commit')||origin?.commit;
  if (!validRemote(remote) || !/^[a-f0-9]{40}$/.test(commit||'')) fail('ORIGIN_DECLARATION_REQUIRED','Declare an explicit credential-free Git URL and exact 40-hex commit.');
  const declared=origin?.files||[]; const paths=argValues(args,'--file'); const covered=[...new Set([...declared,...paths])].sort();
  if (!covered.length) fail('ORIGIN_FILES_REQUIRED','Declare at least one tracked file using config or --file.'); covered.forEach(safeRepoPath);
  for (const ref of covered) {
    const full=path.join(root,...ref.split('/')); assertNoLinks(root,full);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) fail('LOCAL_FILE_MISSING','Required tracked file is absent: '+ref);
  }
  const head=git(root,['rev-parse','HEAD']); if (head!==commit) fail('UNPROVEN_LOCAL_HEAD','Local HEAD does not equal declared commit.');
  const dirty=git(root,['status','--porcelain','--untracked-files=all']); if (dirty) fail('UNPROVEN_DIRTY_TREE','Worktree/index is not clean; required bytes may be uncommitted.');
  const work=fs.mkdtempSync(path.join(os.tmpdir(),'lso-origin-'));
  let result;
  try {
    fs.mkdirSync(path.join(work,'verify'));
    runGit(work,['-C',path.join(work,'verify'),'init','--quiet']);
    const gitRemote=process.platform==='win32'&&remote.startsWith('file:///')?remote.slice('file:///'.length):remote;
    runGit(work,['-C',path.join(work,'verify'),'remote','add','origin',gitRemote]);
    runGit(work,['-C',path.join(work,'verify'),'fetch','--no-tags','--depth=1','origin',commit],120000);
    const fetched=git(path.join(work,'verify'),['rev-parse','FETCH_HEAD']); if (fetched!==commit) fail('ORIGIN_COMMIT_MISMATCH','Fetched object did not resolve to exact commit.');
    const listing=runGit(work,['-C',path.join(work,'verify'),'ls-tree','-r','-z','--full-tree',commit],30000).stdout.toString('utf8');
    const entries=listing.split('\0').filter(Boolean).map(x=>{const tab=x.indexOf('\t');const meta=x.slice(0,tab).split(' ');return {mode:meta[0],type:meta[1],oid:meta[2],path:x.slice(tab+1)};}).sort((a,b)=>a.path.localeCompare(b.path));
    const map=new Map(entries.filter(x=>x.type==='blob').map(x=>[x.path,x]));
    const coveredEvidence=[];
    for (const ref of covered) {
      const entry=map.get(ref); if (!entry) fail('ORIGIN_COVERAGE_MISSING','Declared file is not tracked at exact commit: '+ref);
      const blob=runGit(path.join(work,'verify'),['-C',path.join(work,'verify'),'cat-file','blob',entry.oid],30000).stdout;
      const local=fs.readFileSync(path.join(root,...ref.split('/'))); if (!blob.equals(local)) fail('ORIGIN_BYTES_DIFFER','Local tracked bytes differ from fetched commit: '+ref);
      coveredEvidence.push({path:ref,sha256:sha(local)});
    }
    const normalized=remote.replace(/\.git$/,'');
    result={schemaVersion:1,kind:'lso_git_origin_verification',result:remote.startsWith('file://')?'LOCAL_GIT_FIXTURE_VERIFIED':'REACQUISITION_VERIFIED_FOR_SOURCE',verifiedAt:new Date().toISOString(),originType:'git',remoteFingerprint:sha(normalized),remote:normalized,commit,coveredFiles:coveredEvidence,inventoryDigest:sha(entries.map(x=>({path:x.path,mode:x.mode,oid:x.oid}))),restore_authorized:false,fullReconstruction:'UNPROVEN'};
    result.receiptDigest=sha(result);
    const receiptDir=path.join(root,cfg.runtime,'reacquisition'); assertNoLinks(root,receiptDir); fs.mkdirSync(receiptDir,{recursive:true});
    const target=path.join(receiptDir,commit+'.json'); if (fs.existsSync(target)) fail('RECEIPT_EXISTS','Refusing to overwrite an existing receipt.'); fs.writeFileSync(target,json(result),{flag:'wx'});
  } finally { cleanupOwned(work); if(fs.existsSync(work)) fail('TEMP_CLEANUP_FAILED','Could not remove owned temporary Git directory.'); }
  return result;
}
function cleanupOwned(root) {
  if (!fs.existsSync(root)) return;
  const walk = dir => { for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory()) walk(f); else { try { fs.chmodSync(f,0o600); } catch {} } } try { fs.chmodSync(dir,0o700); } catch {} };
  walk(root); fs.rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
function git(cwd,args) { const r=runGit(cwd,args); return r.stdout.toString('utf8').trim(); }
function runGit(cwd,args,timeout=30000) {
  const r=spawnSync('git',args,{cwd,encoding:null,shell:false,timeout,maxBuffer:8*1024*1024,windowsHide:true});
  if(r.error) fail(r.error.code==='ETIMEDOUT'?'GIT_TIMEOUT':r.error.code==='ENOENT'?'GIT_UNAVAILABLE':'GIT_ERROR','Git verifier failed ('+(r.error.code||'error')+').');
  if(r.status!==0) fail('GIT_REMOTE_FAILURE','Git origin could not be verified (exit '+r.status+').'); return r;
}
function argValue(args,key) { const i=args.indexOf(key); return i>=0?args[i+1]:null; }
function argValues(args,key) { const r=[]; for(let i=0;i<args.length;i++) if(args[i]===key) {if(args[i+1]) r.push(args[i+1]);} return r; }
function renderInit(p) { return `Detected:\n  Git repository          ${p.detected.git?'yes':'no'}\n  Project Corpus V2       ${p.detected.projectCorpusV2?'yes':'no'}\n  package.json            ${p.detected.packageJson?'yes':'no'}\n  test command            ${p.detected.testCommand?'detected (informational)':'not detected'}\n\nWill create:\n${p.create.length?p.create.map(x=>'  '+x).join('\n'):'  (nothing)'}\n\nWill not modify:\n${p.willNotModify.map(x=>'  '+x).join('\n')}\n`; }
function help() { return `Living Software Organism (product ${VERSION}; architecture v0.1-v0.7; experimental organs unversioned)\n\nUsage: lso <command> [path] [options]\n\nCommands:\n  init [path] [--dry-run|--yes] [--json]   Adopt an existing project\n  doctor [path] [--json]                   Read-only health and readiness assessment\n  status [path] [--json]                   Compact current snapshot\n  context [path] --json                    Bounded agent handoff evidence\n  findings [path] [--json]                 Current actionable findings\n  recover plan [path] [--json]             Deterministic recovery plan\n  recover deps [path] [--json]             Declared recovery dependencies\n  recover rehearse [path] [--json]         Isolated recovery rehearsal\n  origin verify [path] [--json]             Explicit bounded Git remote verifier\n  version | --version                      Product and architecture version\n\nOptions:\n  --json  Machine-readable output   --dry-run  Plan only   --yes  Approve shown deterministic init plan\nNo automatic repair, live restore, deletion, shell execution or publication.\n`; }
function execute(argv) {
  let args=argv.slice(); const opt=options(args); args=args.filter(x=>!['--json','--yes','--dry-run'].includes(x));
  if(!args.length||args[0]==='--help'||args[0]==='-h') {process.stdout.write(help());return 0;}
  if(args[0]==='version'||args[0]==='--version'||args[0]==='-v') {const v={productVersion:VERSION,architecture:'v0.1-v0.7',experimental:'unversioned',projectCorpusProtocol:'2.0',projectCorpusRuntime:'2.2.0'};process.stdout.write(opt.json?json(v):`living-software-organism ${VERSION}\nArchitecture: v0.1-v0.7\nExperimental organs: unversioned\nProject Corpus Protocol: 2.0; optional Runtime: 2.2.0\n`);return 0;}
  const command=args.shift();
  if(command==='init') {const result=init(resolveRoot(args[0]),opt);if(opt.json)process.stdout.write(json(result));else if(result.result==='INITIALIZED')process.stdout.write('INITIALIZED'+String.fromCharCode(10));else process.stdout.write(renderInit(result)+'Result: '+result.result+String.fromCharCode(10));return result.result==='INITIALIZED'||opt.dry||opt.json?0:1;}
  if(command==='origin'&&args.shift()==='verify') {const root=resolveRoot(args[0]);const value=originVerify(root,args.slice(1));process.stdout.write(opt.json?json(value):`${value.result}\nCommit: ${value.commit}\nCovered files: ${value.coveredFiles.length}\nFull reconstruction: UNPROVEN\nReceipt: ${path.relative(root,path.join(root,'.lso-runtime','reacquisition',value.commit+'.json'))}\n`);return 0;}
  if(command==='recover') {
    const sub=args.shift();const root=resolveRoot(args[0]); let value;
    if(sub==='deps') value={schemaVersion:1,dependencies:deps(root),authority:'DECLARATIONS_ONLY',externalAvailability:'UNPROVEN'};
    else if(sub==='plan') { const d=doctor(root);value={schemaVersion:1,project:d.project,verified:d.raw.manifest?.sources.filter(x=>x.present).map(x=>x.path)||[],locallyBound:true,missing:d.raw.manifest?.sources.filter(x=>!x.present).map(x=>x.path)||[],requiredForReconstruction:['declared runtime/toolchain','lockfiles','environment/config availability without values','external service/data dependencies'],reacquisition:'UNPROVEN',readiness:d.recovery,commandsExecuted:false,restore_authorized:false}; }
    else if(sub==='rehearse') {const c=loadConfig(root);value=lso.recovery.rehearse(context(root,c));}
    else fail('USAGE','Usage: lso recover <plan|deps|rehearse> [path]');
    process.stdout.write(opt.json?json(value):json(value));return value.result==='PASS'||sub!=='rehearse'?0:1;
  }
  if(!['doctor','status','context','findings'].includes(command)) fail('USAGE','Unknown command. Use lso --help.');
  const root=resolveRoot(args[0]); let value;
  if(command==='doctor') value=doctor(root); else if(command==='status') value=status(root); else if(command==='context') value=contextView(root); else value=findings(root);
  if(opt.json) process.stdout.write(json(value));
  else if(command==='doctor') process.stdout.write(renderDoctor(value));
  else if(command==='status') process.stdout.write(renderStatus(value));
  else if(command==='findings') process.stdout.write(renderFindings(value));
  else process.stdout.write(json(value));
  return command==='doctor'&&value.homeostasis!=='STABLE'?EXIT.DEGRADED:EXIT.OK;
}
function renderDoctor(d) {return `Living Software Organism\n\nProject: ${d.project.id||'unconfigured'}\nIdentity:       ${d.identity}\nContinuity:     ${d.continuity}\nHomeostasis:    ${d.homeostasis}\nRecovery:       ${d.recovery}\nReacquisition:  ${d.reacquisition}\nPhenotype:      ${d.phenotype}\n\nFindings: ${d.findings.length}\n${d.findings.map(f=>`  ${f.severity.padEnd(4)} ${f.id}: ${f.summary}`).join('\n')}\n\nNothing was changed.\n`;}
function renderStatus(s) {return `Project: ${s.projectId||'unconfigured'}\nProtocol agreement: ${s.protocolAgreement?'yes':'no'}\nLifecycle: ${s.lifecycle}\nHomeostasis: ${s.homeostasis}\nRecovery readiness: ${s.recovery}\nRecent history: ${s.latestHistory||'not recorded'}\nNo canonical files were changed.\n`;}
function renderFindings(items) {return items.length?items.map(f=>`${f.severity} ${f.id}: ${f.summary}\n  Next: ${f.nextAction}\n  Repair: ${f.repair}`).join('\n')+'\n':'No findings.\n';}
if(require.main===module) { try { process.exitCode=execute(process.argv.slice(2)); } catch(e) { const usage=['USAGE','ROOT_REQUIRED','UNSAFE_PATH'].includes(e.code); const degraded=['CONFIG_INVALID','CONFIG_MISSING','CORPUS_INCOMPATIBLE','CORPUS_ABSENT','IDENTITY_CONTINUITY','ACTIVE_TASK','SUBSTRATE_NOT_READY','ORIGIN_DECLARATION_REQUIRED','ORIGIN_FILES_REQUIRED','UNPROVEN_LOCAL_HEAD','UNPROVEN_DIRTY_TREE','GIT_REMOTE_FAILURE','GIT_TIMEOUT','GIT_UNAVAILABLE','LOCAL_FILE_MISSING','ORIGIN_COVERAGE_MISSING','ORIGIN_BYTES_DIFFER'].includes(e.code); const code=usage?EXIT.USAGE:degraded?EXIT.DEGRADED:EXIT.ERROR; const message={schemaVersion:1,kind:'lso_cli_error',error:{code:e.code||'INTERNAL_ERROR',message:e.message},authority:'NON_AUTHORITATIVE_DIAGNOSTIC'}; if(process.argv.includes('--json')) process.stdout.write(json(message)); else process.stderr.write(`${e.code||'ERROR'}: ${e.message}\\n`); process.exitCode=code; } }
module.exports={execute,init,doctor,status,contextView,findings,originVerify,validateConfig,validRemote};
