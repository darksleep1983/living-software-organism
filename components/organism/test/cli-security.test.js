'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {test, after} = require('node:test');
const assert = require('node:assert/strict');
const cli = require('../cli');

const runtimeBase = path.resolve(__dirname, '../../../.lso-runtime/cli-security-tests');
fs.mkdirSync(runtimeBase, {recursive:true});
function temp(prefix) {
  return fs.mkdtempSync(path.join(runtimeBase, prefix));
}
after(() => cleanup(runtimeBase));
function cleanup(root) {
  if (!fs.existsSync(root)) return;
  fs.rmSync(root, {recursive:true, force:true, maxRetries:5, retryDelay:50});
}
function init(root) {
  fs.mkdirSync(root, {recursive:true});
  return cli.init(root, {json:false, yes:true, dry:false});
}
function config(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'lso.config.json'), 'utf8'));
}
function writeConfig(root, value) {
  fs.writeFileSync(path.join(root, 'lso.config.json'), JSON.stringify(value, null, 2) + '\n');
}
function originTemps() {
  return fs.readdirSync(os.tmpdir()).filter(x => x.startsWith('lso-origin-')).sort();
}

test('interactive init applies yes, refuses no, and uninitialized context fails bounded', () => {
  const base = temp('lso-cli-security-');
  try {
    const noRoot = path.join(base, 'no');
    fs.mkdirSync(noRoot);
    const noResult = cli.init(noRoot, {json:false, yes:false, dry:false}, () => false);
    assert.equal(noResult.result, 'NOT_APPLIED');
    assert.equal(fs.existsSync(path.join(noRoot, 'lso.config.json')), false);
    assert.equal(fs.existsSync(path.join(noRoot, '.project-corpus')), false);

    const yesRoot = path.join(base, 'yes');
    fs.mkdirSync(yesRoot);
    const yesResult = cli.init(yesRoot, {json:false, yes:false, dry:false}, () => true);
    assert.equal(yesResult.result, 'INITIALIZED');
    assert.equal(fs.existsSync(path.join(yesRoot, 'lso.config.json')), true);
    assert.equal(fs.existsSync(path.join(yesRoot, '.project-corpus', 'state', 'PROJECT.md')), true);

    const uninitialized = path.join(base, 'uninitialized');
    fs.mkdirSync(uninitialized);
    assert.throws(() => cli.contextView(uninitialized), e => e && e.code === 'CONFIG_MISSING');
    assert.equal(fs.existsSync(path.join(uninitialized, 'lso.config.json')), false);
    assert.equal(fs.existsSync(path.join(uninitialized, '.project-corpus')), false);

    const d = cli.doctor(uninitialized);
    assert.equal(d.homeostasis, 'UNHEALTHY');
    const s = cli.status(uninitialized);
    assert.equal(s.projectId, null);
    const f = cli.findings(uninitialized);
    assert.equal(f.some(x => x.id === 'CORPUS_ABSENT'), true);
  } finally {
    cleanup(base);
  }
});

test('malicious or non-exact commit text is rejected before Git execution', () => {
  const root = temp('lso-cli-ref-');
  try {
    init(root);
    const before = originTemps();
    for (const bad of ['main', 'refs/heads/main', '--upload-pack=evil', 'a'.repeat(40) + '\nextra']) {
      assert.throws(
        () => cli.originVerify(root, ['--remote','https://example.invalid/repo.git','--commit',bad,'--file','AGENTS.md']),
        e => e && e.code === 'ORIGIN_DECLARATION_REQUIRED'
      );
    }
    assert.deepEqual(originTemps(), before);
  } finally {
    cleanup(root);
  }
});

test('Git timeout is fail-closed, cleans temp, writes no receipt, and does not mutate local ref sentinel', () => {
  const root = temp('lso-cli-timeout-');
  const commit = 'a'.repeat(40);
  try {
    init(root);
    fs.writeFileSync(path.join(root, 'tracked.txt'), 'exact local bytes\n');
    const cfg = config(root);
    cfg.recovery.origin = {
      type:'git',
      remote:'https://example.invalid/repo.git',
      commit,
      files:['tracked.txt']
    };
    writeConfig(root, cfg);

    const gitDir = path.join(root, '.git');
    fs.mkdirSync(gitDir);
    const head = path.join(gitDir, 'HEAD');
    fs.writeFileSync(head, 'ref: refs/heads/main\n');
    const headBefore = fs.readFileSync(head, 'utf8');
    const before = originTemps();

    cli.__setGitSpawnSyncForTests((command, args) => {
      const ok = (stdout='') => ({status:0, stdout:Buffer.from(stdout), stderr:Buffer.alloc(0)});
      if (args[0] === 'rev-parse' && args[1] === 'HEAD') return ok(commit + '\n');
      if (args[0] === 'status') return ok('');
      if (args.includes('fetch')) {
        return {
          error:Object.assign(new Error('timed out'), {code:'ETIMEDOUT'}),
          status:null,
          stdout:Buffer.alloc(0),
          stderr:Buffer.alloc(0)
        };
      }
      return ok('');
    });

    try {
      assert.throws(() => cli.originVerify(root, []), e => e && e.code === 'GIT_TIMEOUT');
    } finally {
      cli.__setGitSpawnSyncForTests(null);
    }

    assert.deepEqual(originTemps(), before);
    assert.equal(fs.readFileSync(head, 'utf8'), headBefore);
    assert.equal(fs.existsSync(path.join(root, '.lso-runtime', 'reacquisition', commit + '.json')), false);
  } finally {
    cli.__setGitSpawnSyncForTests(null);
    cleanup(root);
  }
});

test('symlink or junction escape is rejected without touching outside sentinel', () => {
  const root = temp('lso-cli-link-');
  const outside = temp('lso-cli-outside-');
  const commit = 'b'.repeat(40);
  let link = null;
  try {
    init(root);
    const sentinel = path.join(outside, 'sentinel.txt');
    fs.writeFileSync(sentinel, 'UNCHANGED');
    link = path.join(root, 'linked-outside');
    fs.symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');

    let error;
    try {
      cli.originVerify(root, [
        '--remote','https://example.invalid/repo.git',
        '--commit',commit,
        '--file','linked-outside/sentinel.txt'
      ]);
    } catch (e) {
      error = e;
    }
    assert(error, 'escape must be rejected');
    assert(['LINK_REJECTED','PATH_CLASSIFICATION_FAILED','PATH_ESCAPE','UNSAFE_PATH'].includes(error.code || error.message));
    assert.equal(fs.readFileSync(sentinel, 'utf8'), 'UNCHANGED');
    assert.equal(fs.existsSync(path.join(root, '.lso-runtime', 'reacquisition', commit + '.json')), false);
  } finally {
    if (link) {
      try {
        if (process.platform === 'win32') fs.rmdirSync(link);
        else fs.unlinkSync(link);
      } catch {}
    }
    cleanup(root);
    cleanup(outside);
  }
});
