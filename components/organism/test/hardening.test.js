'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const test = require('node:test');
const {fileHash} = require('../src/shared');
const {parseMetadata} = require('../src/corpus-metadata');
const homeostasis = require('../src/homeostasis');
const history = require('../src/history');
const recovery = require('../src/recovery');
const {fixture} = require('./helpers');

function clean(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lso-hardening-'));
  t.after(() => {
    fs.rmSync(root, {recursive: true, force: true});
    assert.equal(fs.existsSync(root), false);
  });
  return root;
}

test('fileHash remains SHA-256 equivalent for empty, text, binary and multi-chunk files', t => {
  const root = clean(t);
  const values = [Buffer.alloc(0), Buffer.from('Project continuity\n', 'utf8'),
    Buffer.from([0, 255, 1, 128, 13, 10, 0]), crypto.randomBytes(1024 * 1024 + 7)];
  for (const [index, value] of values.entries()) {
    const file = path.join(root, String(index));
    fs.writeFileSync(file, value);
    assert.equal(fileHash(file), crypto.createHash('sha256').update(value).digest('hex'));
  }
  assert.throws(() => fileHash(path.join(root, 'absent')), /ENOENT/);
});

test('history replacement preserves canonical bytes on failure and retains only 256 records', t => {
  const f = fixture();
  t.after(() => f.cleanup());
  const ref = path.join(f.root, '.lso-runtime/health-history/fixture.jsonl');
  const first = history.capture(f.ctx, {});
  assert.equal(first.result, 'WRITTEN');
  const initial = fs.readFileSync(ref, 'utf8');
  assert.equal(initial.trim().split('\n').length, 1);
  assert.equal(history.capture(f.ctx, {}).result, 'SKIPPED_UNCHANGED');
  fs.appendFileSync(path.join(f.root, 'AGENTS.md'), '\nchanged once\n');
  const originalRename = fs.renameSync;
  fs.renameSync = () => { throw new Error('INJECTED_REPLACE_FAILURE'); };
  try {
    assert.throws(() => history.capture(f.ctx, {}), /INJECTED_REPLACE_FAILURE/);
  } finally {
    fs.renameSync = originalRename;
  }
  assert.equal(fs.readFileSync(ref, 'utf8'), initial);
  assert.deepEqual(fs.readdirSync(path.dirname(ref)).filter(name => name.endsWith('.tmp')), []);
  assert.equal(history.capture(f.ctx, {}).result, 'WRITTEN');
  const after = fs.readFileSync(ref, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(after.length, 2);
  assert.equal(after[0].snapshotId, JSON.parse(initial).snapshotId);
  assert.equal(after[1].previousSnapshotId, after[0].snapshotId);
  assert.deepEqual(fs.readdirSync(path.dirname(ref)).filter(name => name.endsWith('.tmp')), []);

  const older = Array.from({length: 256}, (_, index) => ({kind:'lso_health_snapshot',projectId:'fixture',
    stateDigestSha256: String(index).padStart(64, '0'),snapshotId:`older-${index}`}));
  fs.writeFileSync(ref, older.map(JSON.stringify).join('\n') + '\n');
  const bounded = history.capture(f.ctx, {});
  assert.equal(bounded.result, 'WRITTEN');
  assert.equal(bounded.retainedSnapshots, history.MAX_SNAPSHOTS);
  const lines = fs.readFileSync(ref, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 256);
  assert.equal(lines[0].snapshotId, 'older-1');
  assert.equal(lines.at(-1).previousSnapshotId, 'older-255');
});

test('V2 required metadata rejects malformed Active-Task-ID without interpreting NONE', t => {
  const f = fixture();
  t.after(() => f.cleanup());
  const statusPath = path.join(f.root, '.project-corpus/state/STATUS.md');
  const original = fs.readFileSync(statusPath, 'utf8');
  const project = fs.readFileSync(path.join(f.root, '.project-corpus/state/PROJECT.md'), 'utf8');
  assert(parseMetadata(original, 'STATUS').valid);
  assert(parseMetadata(project, 'PROJECT').valid);
  assert(parseMetadata(original.replace(/\n/g, '\r\n'), 'STATUS').valid);
  assert.equal(homeostasis.inspect(f.ctx).state, 'STABLE');
  fs.writeFileSync(statusPath, original.replace(/\n/g, '\r\n'));
  assert.equal(homeostasis.inspect(f.ctx).state, 'STABLE');
  const mutations = [
    original.replace('Active-Task-ID: NONE\n', ''),
    original.replace('Active-Task-ID: NONE', ' Active-Task-ID: NONE'),
    original.replace('Active-Task-ID: NONE', '**Active-Task-ID**: NONE'),
    original.replace('Active-Task-ID: NONE', 'active-task-id: NONE'),
    original.replace('Active-Task-ID: NONE', 'Active-Task-ID: '),
    original.replace('Active-Task-ID: NONE', 'Active-Task-ID: NONE\nActive-Task-ID: work'),
    original.replace('Last-Verified-At: UNVERIFIED\n', ''),
  ];
  fs.writeFileSync(path.join(f.root, 'lso.config.json'), JSON.stringify({schemaVersion:1,projectId:'fixture',adapter:'project-corpus-v2',runtime:'.lso-runtime'}));
  fs.writeFileSync(statusPath, original.replace('Active-Task-ID: NONE\n', ''));
  const init = spawnSync(process.execPath, [path.resolve(__dirname, '../cli.js'), 'init', f.root, '--dry-run', '--json'],
    {encoding:'utf8', windowsHide:true});
  assert.equal(init.status, 1);
  assert.equal(JSON.parse(init.stdout).error.code, 'CORPUS_INCOMPATIBLE');
  for (const body of mutations) {
    fs.writeFileSync(statusPath, body);
    const view = f.ctx.adapter.read(f.ctx);
    assert(view.identity.metadataIssues.length > 0);
    if (!body.includes('Active-Task-ID: NONE')) assert.notEqual(view.identity.activeTaskId, 'NONE');
    const health = homeostasis.inspect(f.ctx);
    assert.equal(health.state, 'UNHEALTHY');
    assert(health.findings.some(item => item.id === 'PROTOCOL_METADATA' && item.severity === 'FAIL'));
    assert.equal(recovery.buildManifest(f.ctx).readiness.canonical_substrate, 'NOT_READY');
    const cli = spawnSync(process.execPath, [path.resolve(__dirname, '../cli.js'), 'doctor', f.root, '--json'],
      {encoding:'utf8', windowsHide:true});
    assert.equal(cli.status, 1, cli.stderr);
    const output = JSON.parse(cli.stdout);
    assert.equal(output.homeostasis, 'UNHEALTHY');
    assert(output.findings.some(item => item.id === 'PROTOCOL_METADATA'));
    assert(!cli.stdout.includes('INTERNAL_ERROR'));
  }
  const projectPath = path.join(f.root, '.project-corpus/state/PROJECT.md');
  for (const body of [project.replace('Logical-Name: Fixture\n', ''),
    project.replace('Logical-Name: Fixture', ' **Logical-Name**: Fixture'),
    project.replace('Project-ID: fixture', 'project-id: fixture'),
    project.replace('Project-ID: fixture', 'Project-ID: fixture\nProject-ID: fixture')]) {
    fs.writeFileSync(projectPath, body);
    fs.writeFileSync(statusPath, original);
    assert.equal(homeostasis.inspect(f.ctx).state, 'UNHEALTHY');
    assert.equal(recovery.buildManifest(f.ctx).readiness.canonical_substrate, 'NOT_READY');
  }
  fs.writeFileSync(projectPath, project);
  fs.writeFileSync(statusPath, original.replace('Active-Task-ID: NONE', 'Active-Task-ID: work'));
  fs.writeFileSync(path.join(f.root, '.project-corpus/tasks/work.md'), '# Work\n');
  const active = f.ctx.adapter.read(f.ctx);
  assert.equal(active.identity.activeTaskId, 'work');
  assert(active.sources.some(source => source.id === 'ACTIVE_TASK' && source.present && /^[a-f0-9]{64}$/.test(source.sha256)));
  assert.equal(homeostasis.inspect(f.ctx).state, 'STABLE');
  fs.writeFileSync(statusPath, original.replace('Active-Task-ID: NONE', 'Active-Task-ID: ../escape'));
  assert.throws(() => f.ctx.adapter.read(f.ctx), /UNSAFE_TASK_ID/);
  const unsafeCli = spawnSync(process.execPath, [path.resolve(__dirname, '../cli.js'), 'doctor', f.root, '--json'],
    {encoding:'utf8', windowsHide:true});
  assert.equal(unsafeCli.status, 1);
  assert.equal(JSON.parse(unsafeCli.stdout).error.code, 'UNSAFE_TASK_ID');
});
