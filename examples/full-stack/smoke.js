'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const repo = path.resolve(__dirname, '../..');
const lso = require(path.join(repo, 'components', 'organism', 'src'));
const template = path.join(repo, 'components', 'project-corpus', 'templates', 'v2', 'minimal');
const runtimeBase = path.join(repo, '.lso-runtime');
fs.mkdirSync(runtimeBase, {recursive: true});
const project = fs.mkdtempSync(path.join(runtimeBase, 'full-stack-'));

try {
  fs.cpSync(template, project, {recursive: true});
  const ctx = lso.createContext({
    root: project,
    projectId: 'example-project',
    runtime: '.lso-runtime',
    adapter: lso.projectCorpusAdapter()
  });

  const health = lso.homeostasis.inspect(ctx);
  assert.equal(health.state, 'STABLE');

  const manifest = lso.recovery.buildManifest(ctx);
  assert.equal(manifest.identity.corpus_agreement, true);
  assert.equal(manifest.identity.policy_agreement, true);
  assert.equal(manifest.readiness.canonical_substrate, 'READY');
  assert.equal(manifest.restore_authorized, false);

  const rehearsal = lso.recovery.rehearse(ctx);
  assert.equal(rehearsal.result, 'PASS');
  assert.equal(rehearsal.restore_authorized, false);

  console.log(JSON.stringify({
    integration: 'Project Corpus -> LSO adapter -> organism evidence',
    project_id: ctx.projectId,
    homeostasis: health.state,
    canonical_substrate: manifest.readiness.canonical_substrate,
    rehearsal: rehearsal.result,
    restore_authorized: false
  }));
} finally {
  assert(project.startsWith(runtimeBase + path.sep));
  fs.rmSync(project, {recursive: true, force: true});
  assert(!fs.existsSync(project), 'FULL_STACK_CLEANUP_DEBT');
}
