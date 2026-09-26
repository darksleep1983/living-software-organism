'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const recovery = require('../src/recovery');
const {fixture} = require('./helpers');
test('canonical substrate, isolated rehearsal, tampering, stale sources and no restore', () => {
  const f = fixture();
  try {
    const m = recovery.buildManifest(f.ctx); assert.equal(m.readiness.canonical_substrate, 'READY');
    assert.equal(m.readiness.full_application_runtime_recovery, 'UNPROVEN');
    const before = fs.readFileSync(path.join(f.root, 'AGENTS.md'));
    const rehearsal = recovery.rehearse(f.ctx); assert.equal(rehearsal.result, 'PASS'); assert.equal(rehearsal.restore_authorized, false);
    assert.deepEqual(fs.readFileSync(path.join(f.root, 'AGENTS.md')), before);
    f.write('AGENTS.md', '# Changed authority\n'); assert.equal(recovery.verifyRehearsal(f.ctx, rehearsal.receipt).result, 'STALE_SOURCE');
    const receipt = JSON.parse(fs.readFileSync(path.join(f.root, rehearsal.receipt), 'utf8'));
    f.write(receipt.payload + '/AGENTS.md', 'tampered'); assert.equal(recovery.verifyRehearsal(f.ctx, rehearsal.receipt).result, 'FAIL_TAMPERED');
    assert.throws(() => recovery.verifyRehearsal(f.ctx, '../receipt.json'), /UNSAFE_PATH/);
    assert.throws(() => recovery.verifyRehearsal(f.ctx, 'receipt.json'), /RUNTIME_BOUNDARY/);
  } finally { f.cleanup(); }
});
test('identity/policy mismatch and missing exact active task fail closed', () => {
  const f = fixture();
  try {
    f.write('.project-corpus/state/STATUS.md', 'Protocol-Version: 2.0\nProject-ID: other\nActive-Task-ID: missing\n');
    assert.equal(recovery.buildManifest(f.ctx).readiness.canonical_substrate, 'NOT_READY');
    assert.throws(() => recovery.rehearse(f.ctx), /SUBSTRATE_NOT_READY/);
    f.write('.project-corpus/state/STATUS.md', 'Protocol-Version: 2.0\nProject-ID: fixture\nActive-Task-ID: ../escape\n');
    assert.throws(() => recovery.buildManifest(f.ctx), /UNSAFE_TASK_ID/);
  } finally { f.cleanup(); }
});
test('missing continuity is PARTIAL and explicit active task is fingerprinted', () => {
  const f = fixture();
  try {
    fs.rmdirSync(path.join(f.root, '.project-corpus/history'));
    assert.equal(recovery.buildManifest(f.ctx).readiness.canonical_substrate, 'PARTIAL');
    f.write('.project-corpus/state/STATUS.md', 'Protocol-Version: 2.0\nProject-ID: fixture\nActive-Task-ID: work\n');
    f.write('.project-corpus/tasks/work.md', '# Frozen work\n');
    assert(recovery.buildManifest(f.ctx).sources.some(s => s.id === 'ACTIVE_TASK'));
    assert.equal(recovery.rehearse(f.ctx).result, 'PASS');
  } finally { f.cleanup(); }
});
