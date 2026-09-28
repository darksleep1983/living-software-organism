'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const binary = path.resolve(__dirname, '../cli.js');
const cli = require('../cli');
const run = (args, cwd, extra={}) => spawnSync(process.execPath,[binary,...args],{cwd,encoding:'utf8',shell:false,windowsHide:true,...extra});
function temp(prefix='lso-cli-') { return fs.mkdtempSync(path.join(os.tmpdir(),prefix)); }
function initProject(root,name='fixture') {
  fs.mkdirSync(root,{recursive:true}); fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name,scripts:{test:'node test.js'}}));
  const r=run(['init',root,'--yes','--json'],root); assert.equal(r.status,0,r.stderr); return r;
}
function git(cwd,args) { const r=spawnSync('git',args,{cwd,encoding:'utf8',shell:false,windowsHide:true}); assert.equal(r.status,0,r.stderr); return r.stdout.trim(); }
function teardown(root) { if(fs.existsSync(root)) fs.rmSync(root,{recursive:true,force:true,maxRetries:5,retryDelay:100}); assert.equal(fs.existsSync(root),false,'owned temp cleanup'); }
const base=temp();
try {
  const project=path.join(base,'consumer');fs.mkdirSync(project);fs.writeFileSync(path.join(project,'package.json'),'{}');

  // Interactive init decision path: explicit no is write-free; explicit yes applies exactly the plan.
  const interactive=path.join(base,'interactive');fs.mkdirSync(interactive);fs.writeFileSync(path.join(interactive,'package.json'),'{}');
  let interactiveResult=cli.init(interactive,{json:false,yes:false,dry:false},()=>false);
  assert.equal(interactiveResult.result,'NOT_APPLIED');
  assert.equal(fs.existsSync(path.join(interactive,'lso.config.json')),false);
  assert.equal(fs.existsSync(path.join(interactive,'.project-corpus')),false);
  interactiveResult=cli.init(interactive,{json:false,yes:false,dry:false},()=>true);
  assert.equal(interactiveResult.result,'INITIALIZED');
  assert.equal(fs.existsSync(path.join(interactive,'lso.config.json')),true);
  assert.equal(fs.existsSync(path.join(interactive,'.project-corpus/state/PROJECT.md')),true);

  // Uninitialized project must never surface an internal exception.
  const uninitialized=path.join(base,'uninitialized');fs.mkdirSync(uninitialized);
  let ux=run(['context',uninitialized,'--json'],uninitialized);
  assert.notEqual(ux.status,0);
  const uxBody=JSON.parse(ux.stdout);
  assert.equal(uxBody.error.code,'CONFIG_MISSING');
  assert.notEqual(uxBody.error.code,'INTERNAL_ERROR');
  assert.equal(fs.existsSync(path.join(uninitialized,'lso.config.json')),false);
  assert.equal(fs.existsSync(path.join(uninitialized,'.project-corpus')),false);
  for (const command of ['doctor','status','findings']) {
    const view=run([command,uninitialized,'--json'],uninitialized);
    assert.doesNotThrow(()=>JSON.parse(view.stdout));
    assert.doesNotMatch(view.stderr,/TypeError|INTERNAL_ERROR/);
  }
  let r=run(['init',project,'--dry-run','--json'],project);assert.equal(r.status,0,r.stderr);assert(!fs.existsSync(path.join(project,'lso.config.json')));assert.equal(JSON.parse(r.stdout).result,'NOT_APPLIED');
  r=run(['init',project,'--yes','--json'],project);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).result,'INITIALIZED');
  assert(fs.existsSync(path.join(project,'.project-corpus/state/PROJECT.md')));assert(fs.existsSync(path.join(project,'lso.config.json')));
  const original=fs.readFileSync(path.join(project,'.project-corpus/state/PROJECT.md'));
  r=run(['init',project,'--yes','--json'],project);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).create.length,0);assert.deepEqual(fs.readFileSync(path.join(project,'.project-corpus/state/PROJECT.md')),original);
  const healthyDoctor=run(['doctor',project],project);
  assert.equal(healthyDoctor.status,0);
  assert.match(healthyDoctor.stdout,/Required project sources are present/);
  assert.match(healthyDoctor.stdout,/Project identity and declared continuity protocol agree/);
  assert.match(healthyDoctor.stdout,/No active task is declared/);
  assert.match(healthyDoctor.stdout,/Project identity:\s+HEALTHY/);
  assert.match(healthyDoctor.stdout,/Current continuity:\s+HEALTHY/);
  assert.match(healthyDoctor.stdout,/Health:\s+STABLE/);
  assert.match(healthyDoctor.stdout,/Recovery evidence:\s+READY/);
  assert.doesNotMatch(healthyDoctor.stdout,/Homeostasis:|Phenotype:/);
  assert.doesNotMatch(healthyDoctor.stdout,/are missing|do not agree|Task declared in STATUS.md is missing/);
  const healthyDoctorJson=JSON.parse(run(['doctor',project,'--json'],project).stdout);
  assert(healthyDoctorJson.findings.every(f=>f.severity==='PASS' && f.nextAction==='None.'));
  assert.equal(run(['status',project,'--json'],project).status,0);
  for(const command of ['context','findings','recover']) { const args=command==='recover'?['recover','plan',project,'--json']:[command,project,'--json'];const x=run(args,project);assert.equal(x.status,0,x.stderr);assert.doesNotThrow(()=>JSON.parse(x.stdout)); }
  r=run(['recover','rehearse',project,'--json'],project);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).result,'PASS');assert.equal(JSON.parse(r.stdout).restore_authorized,false);
  let config=JSON.parse(fs.readFileSync(path.join(project,'lso.config.json')));config.unknownSecuritySwitch=true;fs.writeFileSync(path.join(project,'lso.config.json'),JSON.stringify(config));assert.notEqual(run(['doctor',project,'--json'],project).status,0);
  fs.writeFileSync(path.join(project,'lso.config.json'),JSON.stringify({schemaVersion:1,projectId:'../bad',adapter:'project-corpus-v2',runtime:'.lso-runtime'}));assert.notEqual(run(['doctor',project,'--json'],project).status,0);
  const partial=path.join(base,'partial');fs.mkdirSync(path.join(partial,'.project-corpus/state'),{recursive:true});fs.writeFileSync(path.join(partial,'.project-corpus/state/PROJECT.md'),'do not replace');assert.notEqual(run(['init',partial,'--yes'],partial).status,0);assert.equal(fs.readFileSync(path.join(partial,'.project-corpus/state/PROJECT.md'),'utf8'),'do not replace');
  // A tilde is valid in a file URL and occurs in Windows short temp paths.
  const source=path.join(base,'source'), bare=path.join(base,'origin~fixture.git');fs.mkdirSync(source);git(source,['init','--quiet']);initProject(source);git(source,['config','user.email','lso@example.invalid']);git(source,['config','user.name','LSO test']);fs.writeFileSync(path.join(source,'.gitattributes'),'* -text\n');fs.writeFileSync(path.join(source,'src.txt'),'exact committed bytes\n');git(source,['add','--all']);git(source,['commit','-m','initial','--quiet']);const commit=git(source,['rev-parse','HEAD']);git(base,['clone','--bare',source,bare]);
  const adopter=path.join(base,'adopter');git(base,['clone','--quiet',bare,adopter]);
  const remote='file:///'+bare.replaceAll('\\','/');const verifyArgs=['origin','verify',adopter,'--remote',remote,'--commit',commit,'--file','src.txt','--json'];
  r=run(verifyArgs,adopter);assert.equal(r.status,0,r.stdout+r.stderr);const receipt=JSON.parse(r.stdout);assert.equal(receipt.result,'LOCAL_GIT_FIXTURE_VERIFIED');assert.equal(receipt.coveredFiles.length,1);assert.equal(receipt.restore_authorized,false);assert.equal(receipt.fullReconstruction,'UNPROVEN');assert(fs.existsSync(path.join(adopter,'.lso-runtime/reacquisition',commit+'.json')));
  const tempBefore=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('lso-origin-')).sort();
  assert.notEqual(run(['origin','verify',adopter,'--remote','https://user:secret@example.invalid/repo.git','--commit',commit,'--file','src.txt','--json'],adopter).status,0);
  assert.notEqual(run(['origin','verify',adopter,'--remote',remote,'--commit',commit,'--file','../outside.txt','--json'],adopter).status,0);
  assert.notEqual(run(['origin','verify',adopter,'--remote','file:///missing-lfs-fixture.git','--commit',commit,'--file','src.txt','--json'],adopter).status,0);
  const tempAfter=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('lso-origin-')).sort();assert.deepEqual(tempAfter,tempBefore,'owned Git temp is removed after remote failure');
  r=run(verifyArgs,adopter,{env:{...process.env,PATH:''}});assert.notEqual(r.status,0);assert.match(r.stdout,/GIT_UNAVAILABLE/);

  // Malicious/non-exact ref text must be rejected before any network/fetch activity.
  const invalidCommits=['main','refs/heads/main','--upload-pack=evil',commit+'\\nextra'];
  const invalidTempBefore=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('lso-origin-')).sort();
  for (const invalid of invalidCommits) {
    const bad=run(['origin','verify',adopter,'--remote',remote,'--commit',invalid,'--file','src.txt','--json'],adopter);
    assert.notEqual(bad.status,0);
    assert.equal(JSON.parse(bad.stdout).error.code,'ORIGIN_DECLARATION_REQUIRED');
  }
  const invalidTempAfter=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('lso-origin-')).sort();
  assert.deepEqual(invalidTempAfter,invalidTempBefore,'invalid refs must not allocate Git verification temp');

  // Deterministic timeout injection is internal-only: production callers cannot supply a spawn implementation.
  const timeoutAdopter=path.join(base,'timeout-adopter');git(base,['clone','--quiet',bare,timeoutAdopter]);
  const refsBefore=git(timeoutAdopter,['show-ref']);
  const timeoutTempBefore=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('lso-origin-')).sort();
  const realSpawn=spawnSync;
  cli.__setGitSpawnSyncForTests((command,args,options)=>{
    if (args.includes('fetch')) return {error:Object.assign(new Error('timed out'),{code:'ETIMEDOUT'}),status:null,stdout:Buffer.alloc(0),stderr:Buffer.alloc(0)};
    return realSpawn(command,args,options);
  });
  try {
    assert.throws(
      ()=>cli.originVerify(timeoutAdopter,['--remote',remote,'--commit',commit,'--file','src.txt']),
      e=>e && e.code==='GIT_TIMEOUT'
    );
  } finally {
    cli.__setGitSpawnSyncForTests(null);
  }
  assert.equal(git(timeoutAdopter,['show-ref']),refsBefore,'timeout must not mutate local refs');
  assert.equal(fs.existsSync(path.join(timeoutAdopter,'.lso-runtime/reacquisition',commit+'.json')),false,'timeout must not write a success receipt');
  const timeoutTempAfter=fs.readdirSync(os.tmpdir()).filter(x=>x.startsWith('lso-origin-')).sort();
  assert.deepEqual(timeoutTempAfter,timeoutTempBefore,'timeout must clean owned Git temp');

  // Link/reparse escape is rejected before Git fetch and cannot alter the outside sentinel.
  const outside=path.join(base,'outside');fs.mkdirSync(outside);const sentinel=path.join(outside,'sentinel.txt');fs.writeFileSync(sentinel,'UNCHANGED');
  const link=path.join(timeoutAdopter,'linked-outside');
  fs.symlinkSync(outside,link,process.platform==='win32'?'junction':'dir');
  const linkResult=run(['origin','verify',timeoutAdopter,'--remote',remote,'--commit',commit,'--file','linked-outside/sentinel.txt','--json'],timeoutAdopter);
  assert.notEqual(linkResult.status,0);
  const linkBody=JSON.parse(linkResult.stdout);
  assert.equal(linkBody.error.code,'LINK_REJECTED');
  assert.equal(fs.readFileSync(sentinel,'utf8'),'UNCHANGED');
  assert.equal(fs.existsSync(path.join(timeoutAdopter,'.lso-runtime/reacquisition',commit+'.json')),false);
  if (process.platform==='win32') fs.rmdirSync(link); else fs.unlinkSync(link);

  fs.writeFileSync(path.join(adopter,'src.txt'),'uncommitted mismatch');assert.notEqual(run(verifyArgs,adopter).status,0);
  assert(!cli.validRemote('https://user:secret@example.invalid/repo.git'));
  const help=run(['--help'],base);assert.equal(help.status,0);assert.match(help.stdout,/Quick start:/);assert.match(help.stdout,/you do not need it for everyday use/);
  assert.equal(run(['--version'],base).status,0);
} finally { teardown(base); }
console.log('CLI tests PASS: init plan/apply/idempotence, read-only views, recovery rehearsal, fail-closed config, and local bare Git reacquisition.');
