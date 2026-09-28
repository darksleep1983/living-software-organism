'use strict';
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const assert=require('node:assert/strict');const {spawnSync}=require('node:child_process');
const packageRoot=path.resolve(__dirname,'..');const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'lso-pack-'));const consumer=path.join(workspace,'consumer');fs.mkdirSync(consumer);
function run(command,args,cwd,timeout=120000) {const r=spawnSync(command,args,{cwd,encoding:'utf8',shell:false,windowsHide:true,timeout,maxBuffer:4*1024*1024});if(r.error)throw r.error;assert.equal(r.status,0,`${command} ${args.join(' ')} failed\n${r.stdout}\n${r.stderr}`);return r.stdout;}
function clean(p) {if(!fs.existsSync(p))return;const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(!e.isSymbolicLink())try{fs.chmodSync(f,0o600);}catch{}}try{fs.chmodSync(d,0o700);}catch{}};walk(p);fs.rmSync(p,{recursive:true,force:true,maxRetries:5,retryDelay:100});if(fs.existsSync(p))throw new Error('PACK_SMOKE_CLEANUP_DEBT');}
try {
  const npmCli=process.env.npm_execpath;
  if(!npmCli) throw new Error('NPM_EXEC_PATH_UNAVAILABLE');
  const output=run(process.execPath,[npmCli,'pack','--json','--pack-destination',workspace],packageRoot);const packed=JSON.parse(output)[0];assert.equal(packed.name,'living-software-organism');assert.equal(packed.version,'0.1.0-rc.3');assert(packed.files.some(x=>x.path==='cli.js'));assert(packed.files.some(x=>x.path==='templates/v2/minimal/.project-corpus/state/PROJECT.md'));const tarball=path.join(workspace,packed.filename);assert(fs.existsSync(tarball));
  run(process.execPath,[npmCli,'install','--offline','--ignore-scripts','--no-audit','--no-fund',tarball],consumer);
  const entry=path.join(consumer,'node_modules','living-software-organism','cli.js');assert(fs.existsSync(entry));
  // Exercise npm's installed executable shim, including Windows Node dispatch.
  // Check before invoking so a broken launcher cannot open a file-association dialog.
  assert(fs.readFileSync(entry,'utf8').startsWith('#!/usr/bin/env node\n'),'INSTALLED_BIN_NODE_SHEBANG_REQUIRED');
  const npxCli=path.join(path.dirname(npmCli),'npx-cli.js');assert(fs.existsSync(npxCli));
  const invoke=args=>run(process.execPath,[npxCli,'--offline','--no-install','lso',...args],consumer);
  assert(invoke(['--help']).includes('Usage: lso'));
  const project=path.join(workspace,'consumer-project');fs.mkdirSync(project);fs.writeFileSync(path.join(project,'package.json'),'{}');
  const dry=JSON.parse(invoke(['init',project,'--dry-run','--json']));assert.equal(dry.result,'NOT_APPLIED');assert(!fs.existsSync(path.join(project,'lso.config.json')));
  const applied=JSON.parse(invoke(['init',project,'--yes','--json']));assert.equal(applied.result,'INITIALIZED');
  const doctor=JSON.parse(invoke(['doctor',project,'--json']));assert.equal(doctor.homeostasis,'STABLE');
  assert.equal(JSON.parse(invoke(['status',project,'--json'])).homeostasis,'STABLE');
  assert.equal(JSON.parse(invoke(['context',project,'--json'])).kind,'lso_agent_context');
  assert(JSON.parse(invoke(['findings',project,'--json'])).every(f=>f.severity==='PASS'));
  const plan=JSON.parse(invoke(['recover','plan',project,'--json']));assert.equal(plan.commandsExecuted,false);assert.equal(plan.restore_authorized,false);assert.equal(plan.reacquisition,'UNPROVEN');
  const rehearsal=JSON.parse(invoke(['recover','rehearse',project,'--json']));assert.equal(rehearsal.result,'PASS');
  assert.equal(rehearsal.restore_authorized,false);
  assert(!fs.existsSync(path.join(consumer,'node_modules','living-software-organism','..','..','..','..','components')),'PACKED_ARTIFACT_MUST_NOT_REQUIRE_MONOREPO');
  console.log(JSON.stringify({result:'PASS',package:packed.name,version:packed.version,files:packed.files.length,localInstall:true,installedBin:'npx --offline --no-install lso',help:true,dryRun:true,init:true,doctor:doctor.homeostasis,rehearsal:rehearsal.result,restore_authorized:false,fullReconstruction:'UNPROVEN',monorepoIndependent:true}));
} finally {clean(workspace);}
