'use strict';
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const assert=require('node:assert/strict');const {spawnSync}=require('node:child_process');
const cli=path.resolve(__dirname,'../cli.js');const root=fs.mkdtempSync(path.join(os.tmpdir(),'lso-demo-'));const project=path.join(root,'sample-app');fs.mkdirSync(project);fs.writeFileSync(path.join(project,'package.json'),JSON.stringify({name:'sample-app',scripts:{test:'node --test'}}));
function run(args,expected=0) {const r=spawnSync(process.execPath,[cli,...args],{cwd:project,encoding:'utf8',shell:false,windowsHide:true});assert.equal(r.status,expected,r.stderr);return r.stdout.trim();}
function clean(p) {if(!fs.existsSync(p))return;const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(!e.isSymbolicLink())try{fs.chmodSync(f,0o600);}catch{}}try{fs.chmodSync(d,0o700);}catch{}};walk(p);fs.rmSync(p,{recursive:true,force:true,maxRetries:5,retryDelay:100});assert(!fs.existsSync(p));}
try {
  run(['init',project,'--yes']);let d=JSON.parse(run(['doctor',project,'--json']));assert.equal(d.homeostasis,'STABLE');console.log('1. Fresh project initialized; doctor = STABLE.');
  fs.rmdirSync(path.join(project,'.project-corpus/history'));d=JSON.parse(run(['doctor',project,'--json'],1));assert.equal(d.homeostasis,'DEGRADED');console.log('2. Removed optional continuity directory; doctor = DEGRADED.');
  fs.mkdirSync(path.join(project,'.project-corpus/history'));d=JSON.parse(run(['doctor',project,'--json']));assert.equal(d.homeostasis,'STABLE');console.log('3. Manually restored directory; doctor = STABLE.');
  const plan=JSON.parse(run(['recover','plan',project,'--json']));assert.equal(plan.commandsExecuted,false);const rehearsal=JSON.parse(run(['recover','rehearse',project,'--json']));assert.equal(rehearsal.result,'PASS');assert.equal(rehearsal.restore_authorized,false);console.log('4. Recovery plan only; rehearsal = PASS; restore_authorized = false.');
} finally {clean(root);}
console.log('Productization demo PASS; temporary consumer removed.');
