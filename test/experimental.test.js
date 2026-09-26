'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const o=require('../src/experimental');
const recovery=require('../src/recovery');
// Per-run disposable ownership stays under project runtime, independent
// of TEMP/TMP and inaccessible OS temp roots.
const fixtureBase=path.resolve(__dirname,'../.lso-runtime');fs.mkdirSync(fixtureBase,{recursive:true});
const run=fs.mkdtempSync(path.join(fixtureBase,'organ-systems-test-'));
const root=path.join(run,'root');fs.mkdirSync(root);
function removeLink(file) {
  let stat;try {stat=fs.lstatSync(file);} catch(error) {if(error.code==='ENOENT') return;throw error;}
  // AppContainer Node may expose a junction as a directory. Non-recursive
  // rmdir removes the exact owned junction itself, never its target contents.
  if(process.platform==='win32') {assert(stat.isDirectory() || stat.isSymbolicLink());fs.rmdirSync(file);}
  else {assert(stat.isSymbolicLink(),'Cleanup must remove only the link');fs.unlinkSync(file);}
}
function cleanupRun() {
  // Unlink every junction before any recursive fixture deletion; never traverse
  // its target. Includes dangling links and failure-before-assertion paths.
  try {removeLink(path.join(root,'dangling'));} finally {
    try {removeLink(path.join(root,'link'));} finally {fs.rmSync(run,{recursive:true,force:true});}
  }
}
function write(ref,text) {const file=path.join(root,ref);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);}
function clone(x) {return JSON.parse(JSON.stringify(x));}
function rejected(fn,code) {assert.throws(fn,new RegExp(code));}
const {createContext}=require('../src/context');
const {projectCorpusAdapter}=require('../src/corpus-adapter');
const ctx=createContext({root,projectId:'fixture',adapter:projectCorpusAdapter()});
const options={};
try {
  write('AGENTS.md','# Fixture\n');
  write('.project-corpus/state/PROJECT.md','Project-ID: fixture\nProtocol-Version: 2.0\n');
  write('.project-corpus/state/STATUS.md','Project-ID: fixture\nProtocol-Version: 2.0\nActive-Task-ID: NONE\n');
  write('.project-corpus/policy.toml','project_id = "fixture"\npolicy_version = "2.0"\n');
  for(const d of ['tasks','reports','history']) fs.mkdirSync(path.join(root,'.project-corpus',d));
  write('source.json','{"command":"bounded fixture"}\n'); write('data/user.txt','durable sentinel');
  write('.lso-runtime/temp.txt','ephemeral'); write('leftover.txt','unknown sentinel');
  const sourceSha=o.fileHash(path.join(root,'source.json'));
  const c={runtime:ctx.runtime,kind:'organ_systems_candidate',schema:1,status:'PENDING_SUPERVISOR_REVIEW',scope:'fixture',project_id:'fixture',physical_root:root,
    substrate_sha256:recovery.buildManifest(ctx,options).source_fingerprint_sha256,
    source:{state:'BOUND',commit:null,reacquisition:'UNPROVEN',files:[{path:'source.json',sha256:sourceSha}]},
    dependencies:[{id:'core',class:'runtime',required:true,probe:{kind:'file',path:'source.json'},reconstruction_probe:{kind:'file',path:'source.json'},note:'fixture runtime'},
      {id:'leaf',class:'external_service',required:false,probe:{kind:'file',path:'source.json'},reconstruction_probe:{kind:'file',path:'source.json'},note:'optional leaf'}],
    data:[{path:'data',class:'DURABLE',required:true}],recipe:[{path:'source.json',sha256:sourceSha}],
    phenotype:[{id:'json',required:true,probe:{kind:'json',path:'source.json',keys:['command']}},
      {id:'source',required:true,probe:{kind:'sha256',path:'source.json',sha256:sourceSha}}],
    organs:[{id:'root',parent:null,required:true,dependencies:['core'],children:['optional']},
      {id:'optional',parent:'root',required:false,dependencies:['leaf'],children:[]}],
    roots:['AGENTS.md','.project-corpus/state','data'],
    objects:[{path:'AGENTS.md',class:'CANONICAL',references:[],operation_ephemeral:false},
      {path:'data/user.txt',class:'DURABLE',references:[],operation_ephemeral:false},
      {path:'.lso-runtime/temp.txt',class:'TEMP',references:[],operation_ephemeral:true},
      {path:'leftover.txt',class:'UNKNOWN',references:[],operation_ephemeral:false}]};
  assert.equal(o.phenotype(ctx,c,options).result,'MATCH');
  const cap=o.capsule(ctx,c,options); assert.equal(cap.state,'PARTIAL');
  assert.equal(cap.source_reacquisition,'UNPROVEN');
  const selfAttested=clone(c);selfAttested.source.reacquisition='VERIFIED';
  rejected(()=>o.capsule(ctx,selfAttested,options),'SOURCE_REACQUISITION_UNVERIFIED');
  const missingOrigin=clone(c);delete missingOrigin.source.reacquisition;
  rejected(()=>o.capsule(ctx,missingOrigin,options),'SOURCE_REACQUISITION_UNVERIFIED');
  rejected(()=>o.verifyCapsule(ctx,c,o.seal({...cap,state:'RECONSTRUCTIBLE'}),options),'STALE_EVIDENCE');
  assert.equal(o.verifyCapsule(ctx,c,cap,options).result,'PASS');
  assert.equal(o.readiness(ctx,c,options).state,'READY');
  const unavailable=clone(c); unavailable.dependencies[0].probe={kind:'file',path:'absent'};
  assert.equal(o.readiness(ctx,unavailable,options).state,'NOT_RECOVERABLE');
  unavailable.dependencies[0].reconstruction_probe={kind:'file',path:'absent'};
  assert.equal(o.readiness(ctx,unavailable,options).state,'NOT_RECOVERABLE');
  assert.equal(o.capsule(ctx,unavailable,options).state,'NOT_RECONSTRUCTIBLE');
  const degraded=clone(c); degraded.dependencies[1].probe={kind:'file',path:'absent'};
  degraded.dependencies[1].reconstruction_probe={kind:'file',path:'absent'};
  assert.equal(o.readiness(ctx,degraded,options).state,'DEGRADED');
  assert.equal(o.capsule(ctx,degraded,options).state,'PARTIAL');
  assert.equal(o.supervision(degraded,{core:'PASS',leaf:'FAIL'}).root,'DEGRADED');
  assert.equal(o.supervision(c,{core:'FAIL',leaf:'PASS'}).optional,'READY');
  const wrong=clone(c); wrong.project_id='wrong'; rejected(()=>o.capsule(ctx,wrong,options),'SCOPE_BINDING');
  assert.equal(o.readiness(ctx,wrong,options).state,'ALIVE');
  const tampered=clone(cap); tampered.state='UNKNOWN'; rejected(()=>o.verifyCapsule(ctx,c,tampered,options),'TAMPERED');
  const boundWrong=o.seal({...cap,project_id:'wrong'}); rejected(()=>o.verifyCapsule(ctx,c,boundWrong,options),'CAPSULE_BINDING');
  rejected(()=>o.verifyCapsule(ctx,c,o.seal({...cap,recipe:[]}),options),'CAPSULE_FINGERPRINT');
  rejected(()=>o.verifyCapsule(ctx,c,o.seal({...cap,dependency_sha256:'0'.repeat(64)}),options),'CAPSULE_FINGERPRINT');
  const runner=clone(c);runner.phenotype[0].probe={kind:'shell',path:'source.json'};
  rejected(()=>o.phenotype(ctx,runner,options),'VERIFIER_NOT_ALLOWLISTED');
  const mismatch=clone(c); mismatch.phenotype[0].probe.keys=['absent']; assert.equal(o.phenotype(ctx,mismatch,options).result,'MISMATCH');
  const partial=clone(c); partial.phenotype[0].probe={kind:'unavailable'}; assert.equal(o.phenotype(ctx,partial,options).result,'PARTIAL');
  partial.phenotype[1].probe={kind:'unavailable'}; assert.equal(o.phenotype(ctx,partial,options).result,'UNVERIFIED');
  const unknown=clone(c);unknown.source.state='UNKNOWN';assert.equal(o.capsule(ctx,unknown,options).state,'UNKNOWN');
  const cycle=clone(c);cycle.organs[0].parent='optional';cycle.organs[1].children=['root'];rejected(()=>o.capsule(ctx,cycle,options),'SUPERVISION_CYCLE');
  const invalid=clone(c);invalid.organs[0].dependencies=['absent'];rejected(()=>o.capsule(ctx,invalid,options),'UNKNOWN_DEPENDENCY');
  const durable=clone(c);durable.objects[1].class='TEMP';rejected(()=>o.hygiene(ctx,durable,options),'DURABLE_DISPOSABLE');
  const protectedObject=clone(c);protectedObject.objects[0].class='CACHE';rejected(()=>o.hygiene(ctx,protectedObject,options),'PROTECTED_DISPOSABLE');
  const before=o.fileHash(path.join(root,'data/user.txt'));
  const hygiene=o.hygiene(ctx,c,options);assert(hygiene.dry_run && !hygiene.deletion_authorized);
  assert(hygiene.debt.includes('leftover.txt'));assert.equal(hygiene.items[3].cleanup_candidate,false);
  assert.equal(o.fileHash(path.join(root,'data/user.txt')),before);assert(fs.existsSync(path.join(root,'.lso-runtime/temp.txt')));
  const reach=clone(c);reach.roots.push('source.json');reach.objects.push({path:'source.json',class:'DURABLE',references:['.lso-runtime/temp.txt'],operation_ephemeral:false});
  assert.equal(o.hygiene(ctx,reach,options).items[2].reachable,true);
  const event={id:'owner',parent:null,scope:'fixture',project_id:'fixture',actor:'owner',kind:'request',started_at:'2026-09-26T00:00:00Z',ended_at:'2026-09-26T00:00:01Z',inputs:[],outputs:[],verification_refs:[],status:'PASS'};
  const child={...event,id:'verify',parent:'owner',actor:'codex',kind:'verifier',outputs:[{path:'source.json',sha256:sourceSha}]};
  const trace=o.trace(ctx,c,[event,child],options);assert.equal(o.verifyTrace(ctx,c,trace,options).result,'PASS');
  rejected(()=>o.trace(ctx,c,[event,{...child,scope:'other'}],options),'TRACE_SCOPE');
  rejected(()=>o.trace(ctx,c,[event,{...child,parent:'absent'}],options),'TRACE_CAUSALITY');
  rejected(()=>o.trace(ctx,c,[{...event,payload:'secret'}],options),'UNKNOWN_FIELD');
  rejected(()=>o.trace(ctx,c,[event,{...child,outputs:[{path:'secret.txt',sha256:sourceSha}]}],options),'SENSITIVE_REFERENCE');
  const badTrace=clone(trace);badTrace.events[1].status='FAIL';rejected(()=>o.verifyTrace(ctx,c,badTrace,options),'TRACE_TAMPERED');
  const stored=o.persist(ctx,c,cap,options);assert(fs.existsSync(path.join(root,stored.path)));
  const stale=clone(c);stale.substrate_sha256='0'.repeat(64);rejected(()=>o.capsule(ctx,stale,options),'STALE_SUBSTRATE');
  fs.renameSync(path.join(root,'AGENTS.md'),path.join(root,'AGENTS.saved'));
  const missingSubstrate=clone(c);missingSubstrate.substrate_sha256=recovery.buildManifest(ctx,options).source_fingerprint_sha256;
  rejected(()=>o.capsule(ctx,missingSubstrate,options),'SUBSTRATE_NOT_READY');
  fs.renameSync(path.join(root,'AGENTS.saved'),path.join(root,'AGENTS.md'));
  const provenance=clone(c);write('.git/HEAD','1'.repeat(40));provenance.source.commit='2'.repeat(40);
  rejected(()=>o.capsule(ctx,provenance,options),'STALE_GIT_PROVENANCE');
  provenance.source.commit='1'.repeat(40);assert.equal(o.capsule(ctx,provenance,options).state,'PARTIAL');
  // Matching base HEAD + rebound modified/untracked bytes cannot acquire that
  // base's provenance, even when all other capsule probes pass.
  write('source.json','{"command":"locally modified"}\n');
  const modified=clone(provenance), modifiedSha=o.fileHash(path.join(root,'source.json'));
  modified.source.files[0].sha256=modifiedSha;modified.recipe[0].sha256=modifiedSha;
  modified.phenotype[1].probe.sha256=modifiedSha;
  write('untracked.json','untracked source');
  modified.source.files.push({path:'untracked.json',sha256:o.fileHash(path.join(root,'untracked.json'))});
  assert.equal(o.phenotype(ctx,modified,options).result,'MATCH');
  assert.equal(o.capsule(ctx,modified,options).state,'PARTIAL');
  write('source.json','{"command":"bounded fixture"}\n');
  write('source.json','{"command":"changed"}\n');rejected(()=>o.verifyCapsule(ctx,c,cap,options),'STALE_SOURCE');
  write('source.json','{"command":"bounded fixture"}\n');
  write('.project-corpus/state/STATUS.md','changed');rejected(()=>o.capsule(ctx,c,options),'STALE_SUBSTRATE');
  for(const ref of ['../outside','/absolute','C:/absolute','current/file:stream','a/../../b','a\\b']) rejected(()=>o.confined(root,ref,true),'UNSAFE_PATH');
  write('ordinary/nested/file.txt','inside');
  assert.equal(fs.readFileSync(o.confined(root,'ordinary/nested/file.txt'),'utf8'),'inside');
  assert.equal(o.confined(root,'ordinary/missing/child',true),path.join(root,'ordinary/missing/child'));
  rejected(()=>o.confined(root,'ordinary/missing/child'),'MISSING_FILE');
  rejected(()=>o.confined(root,'source.json/child',true),'DIRECTORY_REQUIRED');
  const originalReaddir=fs.readdirSync;
  try {
    fs.readdirSync=(dir,opts)=>{if(dir===root) throw new Error('classification unavailable');return originalReaddir(dir,opts);};
    rejected(()=>o.confined(root,'source.json',true),'PATH_CLASSIFICATION_FAILED');
    fs.readdirSync=(dir,opts)=>originalReaddir(dir,opts).filter(e=>dir!==root || e.name!=='source.json');
    rejected(()=>o.confined(root,'source.json',true),'PATH_CLASSIFICATION_FAILED');
  } finally {fs.readdirSync=originalReaddir;}
  // Real symlink/junction refusal, outside sentinel untouched.
  const outside=path.join(run,'outside');fs.mkdirSync(outside);
  try { fs.writeFileSync(path.join(outside,'sentinel'),'unchanged');fs.symlinkSync(outside,path.join(root,'link'),'junction');
    assert(fs.readdirSync(root,{withFileTypes:true}).find(e=>e.name==='link').isSymbolicLink());
    assert.equal(fs.readFileSync(path.join(root,'link/sentinel'),'utf8'),'unchanged','Real junction reaches outside');
    let outsideRead=false;
    rejected(()=>{const file=o.confined(root,'link/sentinel');outsideRead=true;fs.readFileSync(file);},'LINK_REJECTED');
    assert.equal(outsideRead,false,'Confinement refused before outside read');
    rejected(()=>o.confined(root,'link/nonexistent/child',true),'LINK_REJECTED');
    assert.equal(fs.readFileSync(path.join(outside,'sentinel'),'utf8'),'unchanged');
    // AppContainer requires an existing junction target at creation time.
    // Remove that empty owned target afterward to exercise a real dangling link.
    fs.mkdirSync(path.join(outside,'nonexistent'));
    fs.symlinkSync(path.join(outside,'nonexistent'),path.join(root,'dangling'),'junction');
    fs.rmdirSync(path.join(outside,'nonexistent'));
    assert(fs.readdirSync(root,{withFileTypes:true}).find(e=>e.name==='dangling').isSymbolicLink());
    rejected(()=>o.confined(root,'dangling/sentinel',true),'LINK_REJECTED');
    // Exercise failure-path cleanup without weakening the escape assertion.
    assert.throws(()=>{try {assert.fail('injected assertion failure');} finally {
      removeLink(path.join(root,'dangling'));removeLink(path.join(root,'link'));
    }},/injected assertion failure/);
    assert.equal(fs.readFileSync(path.join(outside,'sentinel'),'utf8'),'unchanged');
  } finally {try {removeLink(path.join(root,'dangling'));} finally {
    removeLink(path.join(root,'link'));
    assert.equal(fs.readFileSync(path.join(outside,'sentinel'),'utf8'),'unchanged');
  }}
  const code=fs.readFileSync(path.join(__dirname,'../src/experimental.js'),'utf8');
  for(const forbidden of ['child_process','setInterval(','execFile(','spawn(','rmSync(','unlinkSync(']) assert(!code.includes(forbidden));
  const schema=JSON.parse(fs.readFileSync(path.join(__dirname,'../schemas/experimental.schema.json'),'utf8'));
  assert.deepEqual(Object.keys(c).sort(),schema.required.slice().sort());
  assert.deepEqual(Object.keys(c.source).sort(),schema.properties.source.required.slice().sort());
  assert.equal(schema.properties.source.properties.reacquisition.const,'UNPROVEN');
  console.log('Unversioned LSO organ systems: all adversarial/state/isolation tests PASS');
} finally {cleanupRun();assert(!fs.existsSync(run),'Fixture cleanup debt');}
