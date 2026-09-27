'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const binary = path.resolve(__dirname, '../cli.js');
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
  let r=run(['init',project,'--dry-run','--json'],project);assert.equal(r.status,0,r.stderr);assert(!fs.existsSync(path.join(project,'lso.config.json')));assert.equal(JSON.parse(r.stdout).result,'NOT_APPLIED');
  r=run(['init',project,'--yes','--json'],project);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).result,'INITIALIZED');
  assert(fs.existsSync(path.join(project,'.project-corpus/state/PROJECT.md')));assert(fs.existsSync(path.join(project,'lso.config.json')));
  const original=fs.readFileSync(path.join(project,'.project-corpus/state/PROJECT.md'));
  r=run(['init',project,'--yes','--json'],project);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).create.length,0);assert.deepEqual(fs.readFileSync(path.join(project,'.project-corpus/state/PROJECT.md')),original);
  assert.equal(run(['doctor',project],project).status,0);assert.equal(run(['status',project,'--json'],project).status,0);
  for(const command of ['context','findings','recover']) { const args=command==='recover'?['recover','plan',project,'--json']:[command,project,'--json'];const x=run(args,project);assert.equal(x.status,0,x.stderr);assert.doesNotThrow(()=>JSON.parse(x.stdout)); }
  r=run(['recover','rehearse',project,'--json'],project);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).result,'PASS');assert.equal(JSON.parse(r.stdout).restore_authorized,false);
  let config=JSON.parse(fs.readFileSync(path.join(project,'lso.config.json')));config.unknownSecuritySwitch=true;fs.writeFileSync(path.join(project,'lso.config.json'),JSON.stringify(config));assert.notEqual(run(['doctor',project,'--json'],project).status,0);
  fs.writeFileSync(path.join(project,'lso.config.json'),JSON.stringify({schemaVersion:1,projectId:'../bad',adapter:'project-corpus-v2',runtime:'.lso-runtime'}));assert.notEqual(run(['doctor',project,'--json'],project).status,0);
  const partial=path.join(base,'partial');fs.mkdirSync(path.join(partial,'.project-corpus/state'),{recursive:true});fs.writeFileSync(path.join(partial,'.project-corpus/state/PROJECT.md'),'do not replace');assert.notEqual(run(['init',partial,'--yes'],partial).status,0);assert.equal(fs.readFileSync(path.join(partial,'.project-corpus/state/PROJECT.md'),'utf8'),'do not replace');
  const source=path.join(base,'source'), bare=path.join(base,'origin.git');fs.mkdirSync(source);git(source,['init','--quiet']);initProject(source);git(source,['config','user.email','lso@example.invalid']);git(source,['config','user.name','LSO test']);fs.writeFileSync(path.join(source,'.gitattributes'),'* -text\n');fs.writeFileSync(path.join(source,'src.txt'),'exact committed bytes\n');git(source,['add','--all']);git(source,['commit','-m','initial','--quiet']);const commit=git(source,['rev-parse','HEAD']);git(base,['clone','--bare',source,bare]);
  const adopter=path.join(base,'adopter');git(base,['clone','--quiet',bare,adopter]);
  const remote='file:///'+bare.replaceAll('\\','/');const verifyArgs=['origin','verify',adopter,'--remote',remote,'--commit',commit,'--file','src.txt','--json'];
  r=run(verifyArgs,adopter);assert.equal(r.status,0,r.stderr);const receipt=JSON.parse(r.stdout);assert.equal(receipt.result,'LOCAL_GIT_FIXTURE_VERIFIED');assert.equal(receipt.coveredFiles.length,1);assert.equal(receipt.restore_authorized,false);assert.equal(receipt.fullReconstruction,'UNPROVEN');assert(fs.existsSync(path.join(adopter,'.lso-runtime/reacquisition',commit+'.json')));
  fs.writeFileSync(path.join(adopter,'src.txt'),'uncommitted mismatch');assert.notEqual(run(verifyArgs,adopter).status,0);
  assert(!require('../cli').validRemote('https://user:secret@example.invalid/repo.git'));
  assert.equal(run(['--version'],base).status,0);assert.equal(run(['--help'],base).status,0);
} finally { teardown(base); }
console.log('CLI tests PASS: init plan/apply/idempotence, read-only views, recovery rehearsal, fail-closed config, and local bare Git reacquisition.');
