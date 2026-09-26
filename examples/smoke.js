'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const lso = require('../src');
const {sha, fileHash} = require('../src/shared');
const base = path.resolve(__dirname, '../.lso-runtime'); fs.mkdirSync(base, {recursive: true});
const root = fs.mkdtempSync(path.join(base, 'smoke-'));
try {
  fs.writeFileSync(path.join(root, 'state.json'), '{"identity":"demo","activeTask":"NONE"}\n');
  fs.writeFileSync(path.join(root, 'recipe.md'), '# Operator-owned reconstruction instructions\n');
  // Alternative substrate: no Project Corpus directory or Python Runtime.
  const adapter = {read(ctx) {
    const sources = ['state.json','recipe.md'].map(ref => ({id: ref, path: ref, required: true, present: true, size: fs.statSync(path.join(ctx.root, ref)).size, sha256: fileHash(path.join(ctx.root, ref))}));
    return {identity: {projectId: 'demo', statusProjectId: 'demo', protocol: 'demo-1', statusProtocol: 'demo-1', activeTaskId: 'NONE', policyAgreement: true}, sources, continuity: [], genome_sha256: sha(sources), status_sha256: sources[0].sha256};
  }};
  const ctx = lso.createContext({root, projectId: 'demo', adapter});
  const health = lso.homeostasis.inspect(ctx); assert.equal(health.state, 'STABLE');
  const manifest = lso.recovery.buildManifest(ctx); assert.equal(manifest.readiness.canonical_substrate, 'READY');
  const rehearsal = lso.recovery.rehearse(ctx); assert.equal(rehearsal.result, 'PASS');
  const c = {kind: 'organ_systems_candidate', schema: 1, status: 'PENDING_SUPERVISOR_REVIEW', runtime: ctx.runtime, scope: 'demo', project_id: 'demo', physical_root: root,
    substrate_sha256: manifest.source_fingerprint_sha256,
    source: {state: 'BOUND', commit: null, reacquisition: 'UNPROVEN', files: adapter.read(ctx).sources.map(s => ({path: s.path, sha256: s.sha256}))},
    dependencies: [{id: 'runtime', class: 'runtime', required: true, probe: {kind: 'file', path: 'state.json'}, reconstruction_probe: {kind: 'file', path: 'state.json'}, note: 'Declared file availability only; actual Node execution is this separate smoke evidence.'}], data: [],
    recipe: [{path: 'recipe.md', sha256: fileHash(path.join(root, 'recipe.md'))}],
    phenotype: [{id: 'identity', required: true, probe: {kind: 'json', path: 'state.json', keys: ['identity']}}],
    organs: [{id: 'core', parent: null, required: true, dependencies: ['runtime'], children: []}], roots: ['state.json','recipe.md'],
    objects: [{path: 'state.json', class: 'DURABLE', references: ['recipe.md'], operation_ephemeral: false}]};
  const capsule = lso.experimental.capsule(ctx, c); assert.equal(capsule.state, 'PARTIAL');
  assert.equal(lso.experimental.verifyCapsule(ctx, c, capsule).result, 'PASS');
  assert.equal(lso.experimental.readiness(ctx, c).state, 'READY');
  assert.equal(lso.experimental.hygiene(ctx, c).deletion_authorized, false);
  assert.equal(lso.metabolism.evaluate(ctx, {budgets: []}, [], Date.now()).metabolism.state, 'UNCONFIGURED');
  console.log(JSON.stringify({homeostasis: health.state, substrate: manifest.readiness.canonical_substrate, rehearsal: rehearsal.result, phenotype: capsule.phenotype.result, capsule: capsule.state, reacquisition: capsule.source_reacquisition, restore_authorized: false}));
} finally {
  assert(root.startsWith(base + path.sep) && path.basename(root).startsWith('smoke-'));
  fs.rmSync(root, {recursive: true}); assert(!fs.existsSync(root), 'SMOKE_CLEANUP_DEBT');
}
