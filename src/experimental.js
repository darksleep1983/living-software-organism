'use strict';

// Unversioned LSO candidate. No execution, network, restore or deletion API.
const fs = require('fs');
const crypto = require('crypto');
const recovery = require('./recovery');
const sha = recovery.stableSha;
const STATES = ['READY', 'DEGRADED', 'RECOVERABLE', 'NOT_RECOVERABLE', 'ALIVE'];
const CLASSES = ['CANONICAL', 'DURABLE', 'RUNTIME', 'CACHE', 'TEMP', 'SUPERSEDED', 'ORPHANED', 'UNKNOWN'];
const {demand, seal, intact, fileHash} = require('./shared');
function keys(value, allowed) {
  demand(value && typeof value === 'object' && !Array.isArray(value), 'OBJECT_REQUIRED');
  demand(Object.keys(value).every(k => allowed.includes(k)), 'UNKNOWN_FIELD');
}
function id(value) { demand(typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(value), 'INVALID_ID'); }
function hash(value) { demand(typeof value === 'string' && /^[a-f0-9]{64}$/.test(value), 'HASH_REQUIRED'); }
const {confined, relative} = require('./paths');
function gitHead(root) {
  const file=confined(root,'.git/HEAD');
  const head=fs.readFileSync(file,'utf8').trim();
  if(/^[a-f0-9]{40}$/.test(head)) return head;
  demand(head.startsWith('ref: refs/') && !head.includes('..'),'GIT_HEAD_INVALID');
  const ref=head.slice(5), full=confined(root,'.git/'+ref,true);
  if(fs.existsSync(full)) return fs.readFileSync(full,'utf8').trim();
  const packed=confined(root,'.git/packed-refs');
  const line=fs.readFileSync(packed,'utf8').split(/\r?\n/).find(x=>x.endsWith(' '+ref));
  demand(line,'GIT_REF_UNAVAILABLE');return line.split(' ')[0];
}
function info(ctx) { demand(ctx && ctx.adapter && ctx.root && ctx.projectId, 'CONTEXT_REQUIRED'); return {scope:ctx.projectId, projectId:ctx.projectId, root:ctx.root, runtime:ctx.runtime}; }
function list(value, maximum = 256) { demand(Array.isArray(value) && value.length <= maximum, 'BOUNDED_ARRAY_REQUIRED'); }
function unique(items) { demand(new Set(items.map(x => x.id)).size === items.length, 'DUPLICATE_ID'); }

function validateContract(c, scope, options = {}) {
  keys(c, ['kind','schema','status','scope','project_id','physical_root','substrate_sha256','source','dependencies','data','recipe','phenotype','organs','roots','objects','runtime']);
  const s = info(scope, options);
  demand(c.kind === 'organ_systems_candidate' && c.schema === 1 && c.status === 'PENDING_SUPERVISOR_REVIEW', 'CANDIDATE_REQUIRED');
  demand(c.runtime === s.runtime, 'RUNTIME_BINDING');
  demand(c.scope === s.scope && c.project_id === s.projectId && c.physical_root === s.root, 'SCOPE_BINDING_MISMATCH');
  hash(c.substrate_sha256);
  const manifest=recovery.buildManifest(scope,options);
  demand(c.substrate_sha256 === manifest.source_fingerprint_sha256, 'STALE_SUBSTRATE');
  demand(manifest.readiness.canonical_substrate !== 'NOT_READY', 'SUBSTRATE_NOT_READY');
  keys(c.source, ['state','commit','files','reacquisition']);
  demand(['BOUND','UNBOUND','UNKNOWN'].includes(c.source.state), 'SOURCE_STATE');
  // BOUND is local integrity only. No durable-origin verifier is implemented.
  // Fail closed rather than accepting a declaration's self-attestation as proof.
  demand(c.source.reacquisition === 'UNPROVEN', 'SOURCE_REACQUISITION_UNVERIFIED');
  if (c.source.commit !== null) demand(/^[a-f0-9]{40}$/.test(c.source.commit), 'COMMIT_INVALID');
  if (c.source.commit !== null) demand(gitHead(s.root)===c.source.commit,'STALE_GIT_PROVENANCE');
  list(c.source.files); demand(c.source.state !== 'BOUND' || c.source.files.length > 0, 'SOURCE_INVENTORY_REQUIRED');
  for (const f of c.source.files) {
    keys(f, ['path','sha256']); hash(f.sha256);
    const full = confined(s.root, f.path); demand(fs.lstatSync(full).isFile(), 'REGULAR_FILE_REQUIRED');
    demand(fileHash(full) === f.sha256, 'STALE_SOURCE');
  }
  demand(new Set(c.source.files.map(f => f.path)).size === c.source.files.length, 'DUPLICATE_SOURCE');
  for (const field of ['dependencies','data','recipe','phenotype','organs','roots','objects']) list(c[field]);
  for (const field of ['dependencies','phenotype','organs']) unique(c[field]);
  for (const d of c.dependencies) {
    keys(d, ['id','class','required','probe','reconstruction_probe','note']); id(d.id);
    demand(['runtime','build','platform','external_service'].includes(d.class), 'DEPENDENCY_CLASS');
    demand(typeof d.required === 'boolean' && typeof d.note === 'string' && d.note.length <= 1024, 'DEPENDENCY_DECLARATION');
    validateProbe(d.probe);
    validateProbe(d.reconstruction_probe);
  }
  for (const d of c.data) {
    keys(d, ['path','class','required']); relative(d.path);
    demand(['DURABLE','GENERATED','CACHE'].includes(d.class) && typeof d.required === 'boolean', 'DATA_CLASS');
  }
  for (const r of c.recipe) {
    keys(r, ['path','sha256']); relative(r.path); hash(r.sha256);
    demand(c.source.files.some(f => f.path === r.path && f.sha256 === r.sha256), 'UNBOUND_RECIPE');
  }
  for (const p of c.phenotype) {
    keys(p, ['id','required','probe']); id(p.id); demand(typeof p.required === 'boolean', 'PHENOTYPE_REQUIRED'); validateProbe(p.probe);
  }
  validateTree(c.organs, c.dependencies.map(d => d.id));
  validateHygiene(c);
  return s;
}
function validateProbe(p) {
  keys(p, ['kind','path','sha256','keys']);
  demand(['file','sha256','json','unavailable'].includes(p.kind), 'VERIFIER_NOT_ALLOWLISTED');
  if (p.kind === 'unavailable') { demand(Object.keys(p).length === 1, 'UNAVAILABLE_HAS_PAYLOAD'); return; }
  relative(p.path);
  if (p.kind === 'sha256') hash(p.sha256);
  if (p.kind === 'json') { list(p.keys, 32); demand(p.keys.every(k => typeof k === 'string' && k.length < 128), 'JSON_KEYS'); }
  demand(p.sha256 === undefined || p.kind === 'sha256', 'PROBE_FIELD');
  demand(p.keys === undefined || p.kind === 'json', 'PROBE_FIELD');
}
function probe(root, p) {
  validateProbe(p);
  if (p.kind === 'unavailable') return 'UNVERIFIED';
  try {
    const full = confined(root, p.path, true);
    if (!fs.existsSync(full) || !fs.lstatSync(full).isFile()) return 'FAIL';
    if (p.kind === 'sha256') return fileHash(full) === p.sha256 ? 'PASS' : 'FAIL';
    if (p.kind === 'json') {
      const value = JSON.parse(fs.readFileSync(full, 'utf8'));
      return p.keys.every(k => Object.hasOwn(value, k)) ? 'PASS' : 'FAIL';
    }
    return 'PASS';
  } catch { return 'FAIL'; }
}
function phenotype(scope, c, options = {}) {
  const s = validateContract(c, scope, options);
  const checks = c.phenotype.map(p => ({id:p.id, required:p.required, result:probe(s.root,p.probe)}));
  const required = checks.filter(p => p.required);
  const result = required.some(p => p.result === 'FAIL') ? 'MISMATCH'
    : (!required.length || required.every(p => p.result === 'UNVERIFIED') ? 'UNVERIFIED'
      : checks.some(p => p.result !== 'PASS') ? 'PARTIAL' : 'MATCH');
  return seal({kind:'phenotype_receipt', scope:s.scope, project_id:s.projectId, contract_sha256:sha(c),
    observed_at:new Date().toISOString(), result, checks, restore_authorized:false});
}
function validateTree(nodes, dependencyIds) {
  list(nodes,64); unique(nodes);
  const ids = nodes.map(n => n.id), visiting = new Set(), done = new Set();
  for (const n of nodes) {
    keys(n,['id','parent','required','dependencies','children']); id(n.id);
    demand(n.parent === null || ids.includes(n.parent), 'INVALID_PARENT');
    demand(typeof n.required === 'boolean', 'REQUIRED_BOOLEAN'); list(n.dependencies,64); list(n.children,64);
    demand(n.dependencies.every(d => dependencyIds.includes(d)), 'UNKNOWN_DEPENDENCY');
    demand(n.children.every(d => ids.includes(d)), 'UNKNOWN_CHILD');
    demand(new Set(n.children).size === n.children.length && new Set(n.dependencies).size === n.dependencies.length, 'DUPLICATE_EDGE');
    for (const child of n.children) demand(nodes.find(x => x.id === child).parent === n.id, 'PARENT_CHILD_MISMATCH');
    if (n.parent !== null) demand(nodes.find(x => x.id === n.parent).children.includes(n.id), 'PARENT_CHILD_MISMATCH');
  }
  function visit(n) {
    demand(!visiting.has(n.id), 'SUPERVISION_CYCLE'); if(done.has(n.id)) return;
    visiting.add(n.id); n.children.forEach(x => visit(nodes.find(v => v.id === x))); visiting.delete(n.id); done.add(n.id);
  }
  nodes.forEach(visit);
}
function supervision(c, results) {
  validateTree(c.organs,c.dependencies.map(d=>d.id));
  const out = new Map();
  function visit(n) {
    if(out.has(n.id)) return out.get(n.id);
    const deps = n.dependencies.map(x => ({required:c.dependencies.find(d=>d.id===x).required, result:results[x] || 'UNVERIFIED'}));
    const children = n.children.map(x => ({node:c.organs.find(v=>v.id===x), state:visit(c.organs.find(v=>v.id===x))}));
    const blocked = deps.some(d=>d.required && d.result !== 'PASS') || children.some(d=>d.node.required && d.state==='UNAVAILABLE');
    const degraded = deps.some(d=>d.result !== 'PASS') || children.some(d=>d.state !== 'READY');
    const state = blocked ? 'UNAVAILABLE' : degraded ? 'DEGRADED' : 'READY'; out.set(n.id,state); return state;
  }
  c.organs.forEach(visit); return Object.fromEntries(out);
}
function capsule(scope,c,options = {}) {
  const s = validateContract(c,scope,options);
  const dependencies = c.dependencies.map(d=>({id:d.id, class:d.class, required:d.required,
    result:probe(s.root,d.reconstruction_probe), execution_result:probe(s.root,d.probe)}));
  const data = c.data.map(d=>({...d,present:fs.existsSync(confined(s.root,d.path,true))}));
  const p = phenotype(scope,c,options);
  const failed = dependencies.some(d=>d.required && d.result==='FAIL') || data.some(d=>d.required && !d.present) || p.result==='MISMATCH';
  const unknown = c.source.state !== 'BOUND' || c.source.reacquisition !== 'VERIFIED' || !c.recipe.length || p.result !== 'MATCH'
    || dependencies.some(d=>d.result !== 'PASS');
  const state = failed ? 'NOT_RECONSTRUCTIBLE' : c.source.state==='UNKNOWN' ? 'UNKNOWN' : unknown ? 'PARTIAL' : 'RECONSTRUCTIBLE';
  const organs = supervision(c,Object.fromEntries(dependencies.map(d=>[d.id,d.execution_result])));
  return seal({kind:'rebirth_capsule', status:'PENDING_SUPERVISOR_REVIEW', scope:s.scope, project_id:s.projectId,
    implementation_sha256:fileHash(__filename),
    observed_at:new Date().toISOString(), contract_sha256:sha(c), source_sha256:sha(c.source),
    dependency_sha256:sha(c.dependencies), recipe_sha256:sha(c.recipe), substrate_sha256:c.substrate_sha256,
    recipe:c.recipe, dependencies,data,phenotype:p,organs,state,
    source_reacquisition:c.source.reacquisition,
    reconstruction_scope:'DECLARED_PROPERTIES_ONLY', restore_authorized:false, live_overwrite:false, isolated_only:true});
}
function verifyCapsule(scope,c,receipt,options = {}) {
  validateContract(c,scope,options);
  keys(receipt,['kind','status','scope','project_id','observed_at','contract_sha256','source_sha256','dependency_sha256','recipe_sha256','substrate_sha256','recipe','dependencies','data','phenotype','organs','state','source_reacquisition','reconstruction_scope','restore_authorized','live_overwrite','isolated_only','receipt_sha256','implementation_sha256']);
  demand(intact(receipt) && receipt.kind==='rebirth_capsule' && receipt.restore_authorized===false
    && receipt.live_overwrite===false && receipt.isolated_only===true, 'TAMPERED_CAPSULE');
  demand(receipt.scope===c.scope && receipt.project_id===c.project_id && receipt.contract_sha256===sha(c), 'CAPSULE_BINDING');
  demand(receipt.source_sha256===sha(c.source) && receipt.dependency_sha256===sha(c.dependencies)
    && receipt.implementation_sha256===fileHash(__filename)
    && receipt.recipe_sha256===sha(c.recipe) && receipt.substrate_sha256===c.substrate_sha256
    && sha(receipt.recipe)===sha(c.recipe) && intact(receipt.phenotype)
    && receipt.phenotype.contract_sha256===sha(c) && receipt.status==='PENDING_SUPERVISOR_REVIEW'
    && receipt.reconstruction_scope==='DECLARED_PROPERTIES_ONLY', 'CAPSULE_FINGERPRINT_MISMATCH');
  const current = capsule(scope,c,options);
  const projection = r=>({state:r.state,source_reacquisition:r.source_reacquisition,dependencies:r.dependencies,data:r.data,checks:r.phenotype.checks,organs:r.organs});
  demand(sha(projection(receipt))===sha(projection(current)), 'STALE_EVIDENCE');
  return {result:'PASS', restore_authorized:false};
}
function readiness(scope,c,options = {}) {
  const substrate = recovery.buildManifest(scope,options);
  const alive = substrate.identity.corpus_agreement && substrate.identity.policy_agreement && substrate.readiness.canonical_substrate !== 'NOT_READY';
  let state = alive ? 'ALIVE' : 'NOT_RECOVERABLE', cap = null, reason = null;
  try {
    cap = capsule(scope,c,options);
    const roots = c.organs.filter(n=>n.parent===null && n.required).map(n=>cap.organs[n.id]);
    if(alive && roots.length && roots.every(x=>x==='READY') && cap.phenotype.result==='MATCH') state='READY';
    else if(alive && roots.length && roots.every(x=>x!=='UNAVAILABLE') && cap.phenotype.result!=='MISMATCH') state='DEGRADED';
    else if(alive) state=cap.state==='RECONSTRUCTIBLE' ? 'RECOVERABLE' : 'NOT_RECOVERABLE';
  } catch(error) { reason=error.message; }
  return {kind:'organ_readiness', alive, state, reason, health_separate:true, capsule_state:cap && cap.state, automatic_action:false};
}
function protectedPath(ref) {
  return ref==='AGENTS.md' || ref==='.project-corpus/policy.toml' || /^\.project-corpus\/(state|tasks|reports|history)(\/|$)/.test(ref) || /^(src|test|docs|examples)(\/|$)/.test(ref);
}
function validateHygiene(c) {
  for(const root of c.roots) relative(root);
  demand(new Set(c.roots).size===c.roots.length, 'DUPLICATE_ROOT');
  demand(new Set(c.objects.map(x=>x.path)).size===c.objects.length, 'DUPLICATE_OBJECT');
  for(const o of c.objects) {
    keys(o,['path','class','references','operation_ephemeral']); relative(o.path); list(o.references);
    demand(CLASSES.includes(o.class) && typeof o.operation_ephemeral==='boolean', 'CLEANUP_CLASS');
    o.references.forEach(relative);
    demand(!protectedPath(o.path) || ['CANONICAL','DURABLE','UNKNOWN'].includes(o.class), 'PROTECTED_DISPOSABLE');
    demand(!c.data.some(d=>d.class==='DURABLE' && (o.path===d.path || o.path.startsWith(d.path+'/') || d.path.startsWith(o.path+'/')))
      || ['DURABLE','CANONICAL','UNKNOWN'].includes(o.class), 'DURABLE_DISPOSABLE');
    demand(!c.source.files.some(f=>f.path===o.path || f.path.startsWith(o.path+'/'))
      || ['CANONICAL','DURABLE','UNKNOWN'].includes(o.class), 'SOURCE_DISPOSABLE');
    if(o.operation_ephemeral) demand(['TEMP','CACHE'].includes(o.class) && o.path.startsWith(c.runtime + '/'), 'EPHEMERAL_BOUNDARY');
  }
}
function hygiene(scope,c,options = {}) {
  const s = validateContract(c,scope,options), reachable = new Set(c.roots), queue=[...c.roots];
  while(queue.length) {
    const next=queue.shift(); const o=c.objects.find(x=>x.path===next); if(!o) continue;
    for(const r of o.references) if(!reachable.has(r)) {reachable.add(r);queue.push(r);}
  }
  const items=c.objects.map(o=>{
    const file=confined(s.root,o.path,true), present=fs.existsSync(file), stat=present ? fs.lstatSync(file) : null;
    const live=[...reachable].some(r=>o.path===r || o.path.startsWith(r+'/'));
    const cleanup_candidate=present && !live && ['TEMP','CACHE','SUPERSEDED','ORPHANED'].includes(o.class);
    return {...o,present,reachable:live,size:stat && stat.isFile() ? stat.size : null,cleanup_candidate,
      reason:live?'LIVING_ROOT_OR_REFERENCE':o.class==='UNKNOWN'?'UNKNOWN_PROTECTED':cleanup_candidate?'PLAN_ONLY':'RETAIN'};
  });
  const counts=Object.fromEntries(CLASSES.map(k=>[k,items.filter(x=>x.class===k).length]));
  const debt=items.filter(x=>x.present && !x.reachable && (x.cleanup_candidate || x.class==='UNKNOWN'));
  return {kind:'hygiene_receipt',scope:s.scope,project_id:s.projectId,living_roots:c.roots,counts,items,
    dry_run:true,deletion_authorized:false,debt:debt.map(x=>x.path),
    result:debt.length?'UNRESOLVED_CLEANUP_DEBT':items.some(x=>x.present && ['CACHE','RUNTIME'].includes(x.class))?'BOUNDED_RUNTIME_CACHE_ONLY':'NO_CLEANUP_DEBT'};
}
function trace(scope,c,events,options = {}) {
  const s=validateContract(c,scope,options); list(events,64); demand(events.length>0,'EMPTY_TRACE'); unique(events);
  const seen=new Set();
  for(const e of events) {
    keys(e,['id','parent','project_id','scope','actor','kind','started_at','ended_at','inputs','outputs','verification_refs','status']);
    id(e.id); id(e.actor); demand(e.scope===s.scope && e.project_id===s.projectId,'TRACE_SCOPE_MISMATCH');
    demand(e.parent===null ? seen.size===0 : seen.has(e.parent),'TRACE_CAUSALITY');
    demand(['request','task','executor','capability','artifact','verifier','result'].includes(e.kind),'TRACE_KIND');
    demand(['PASS','FAIL','UNVERIFIED'].includes(e.status),'TRACE_STATUS');
    demand(Number.isFinite(Date.parse(e.started_at)) && Number.isFinite(Date.parse(e.ended_at))
      && Date.parse(e.ended_at)>=Date.parse(e.started_at),'TRACE_TIME');
    if(e.parent) { const parent=events.find(x=>x.id===e.parent); demand(Date.parse(e.started_at)>=Date.parse(parent.started_at),'TRACE_TIME_CAUSALITY'); }
    for(const field of ['inputs','outputs','verification_refs']) {
      list(e[field],32);
      for(const r of e[field]) {
        keys(r,['path','sha256']); hash(r.sha256);
        demand(!/(secret|credential|token|\.env|private[-_]key)/i.test(r.path),'SENSITIVE_REFERENCE');
        demand(fileHash(confined(s.root,r.path))===r.sha256,'TRACE_ARTIFACT_BINDING');
      }
    }
    seen.add(e.id);
  }
  return seal({kind:'causal_trace',trace_id:crypto.randomBytes(16).toString('hex'),scope:s.scope,project_id:s.projectId,
    implementation_sha256:fileHash(__filename),
    contract_sha256:sha(c),events,raw_payloads:false,semantic_authority:false});
}
function verifyTrace(scope,c,receipt,options = {}) {
  keys(receipt,['kind','trace_id','scope','project_id','contract_sha256','events','raw_payloads','semantic_authority','receipt_sha256','implementation_sha256']);
  demand(intact(receipt) && receipt.kind==='causal_trace' && /^[a-f0-9]{32}$/.test(receipt.trace_id),'TRACE_TAMPERED');
  demand(receipt.raw_payloads===false && receipt.semantic_authority===false,'TRACE_AUTHORITY');
  demand(receipt.implementation_sha256===fileHash(__filename),'STALE_TRACE_IMPLEMENTATION');
  demand(receipt.contract_sha256===sha(c) && receipt.scope===c.scope && receipt.project_id===c.project_id,'TRACE_BINDING');
  trace(scope,c,receipt.events,options); return {result:'PASS'};
}
function persist(scope,c,receipt,options = {}) {
  const s=validateContract(c,scope,options);
  demand(['rebirth_capsule','causal_trace'].includes(receipt.kind),'RECEIPT_KIND');
  if(receipt.kind==='rebirth_capsule') verifyCapsule(scope,c,receipt,options); else verifyTrace(scope,c,receipt,options);
  const relativeDir=s.runtime+'/experimental';
  id(s.projectId); const dir=confined(s.root,relativeDir,true); fs.mkdirSync(dir,{recursive:true});
  const name=receipt.kind+'_'+crypto.randomBytes(8).toString('hex')+'.json';
  const file=confined(s.root,relativeDir+'/'+name,true);
  fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  const readback=JSON.parse(fs.readFileSync(file,'utf8')); demand(sha(readback)===sha(receipt),'READBACK_FAILED');
  return {path:relativeDir+'/'+name,sha256:fileHash(file)};
}
module.exports={validateContract,phenotype,capsule,verifyCapsule,readiness,supervision,hygiene,trace,verifyTrace,persist,confined,fileHash,seal,STATES,CLASSES};
