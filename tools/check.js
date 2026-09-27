'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const corpus = path.join(root, 'components', 'project-corpus');
const organism = path.join(root, 'components', 'organism');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

assert(fs.existsSync(path.join(corpus, 'MANIFEST_SHA256.json')), 'CORPUS_MANIFEST_MISSING');
assert(fs.existsSync(path.join(organism, 'src', 'index.js')), 'ORGANISM_ENTRY_MISSING');
assert(!fs.existsSync(path.join(corpus, '.git')), 'NESTED_CORPUS_GIT');
assert(!fs.existsSync(path.join(organism, '.git')), 'NESTED_ORGANISM_GIT');

const manifest = JSON.parse(fs.readFileSync(path.join(corpus, 'MANIFEST_SHA256.json'), 'utf8'));
const missing = [];
const mismatched = [];
for (const [rel, expected] of Object.entries(manifest.files)) {
  const file = path.join(corpus, ...rel.split('/'));
  if (!fs.existsSync(file)) missing.push(rel);
  else if (hash(file) !== expected) mismatched.push(rel);
}
assert.deepEqual(missing, [], 'CORPUS_IMPORT_MISSING');
assert.deepEqual(mismatched, [], 'CORPUS_IMPORT_HASH_MISMATCH');

const corpusPackage = fs.readFileSync(path.join(corpus, 'pyproject.toml'), 'utf8');
assert(corpusPackage.includes('name = "project-corpus"'), 'CORPUS_PACKAGE_IDENTITY');
assert(corpusPackage.includes('version = "2.2.0"'), 'CORPUS_RUNTIME_VERSION');

const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(rootPackage.license, 'MIT');
assert(fs.existsSync(path.join(root, 'LICENSE')), 'ROOT_MIT_LICENSE_MISSING');
assert.equal(rootPackage.scripts.test, 'node tools/verify.js');
assert.equal(rootPackage.scripts.check, 'node tools/check.js');
assert(rootPackage.scripts.demo && rootPackage.scripts['pack:organism']);

const organismPackage = JSON.parse(fs.readFileSync(path.join(organism, 'package.json'), 'utf8'));
assert.equal(organismPackage.name, 'living-software-organism');
assert.equal(organismPackage.version, '0.1.0-rc.1');
assert.equal(organismPackage.private, undefined);
assert.equal(organismPackage.bin.lso, 'cli.js');
assert.equal(organismPackage.license, 'MIT');
assert(fs.existsSync(path.join(organism, 'LICENSE')), 'ORGANISM_MIT_LICENSE_MISSING');

const excludedAnywhere = new Set(['.git', 'node_modules', '__pycache__', '.pytest_cache', 'site', 'build', 'dist']);
const excludedRootOnly = new Set(['.project-corpus', '.lso-runtime']);
const textExt = new Set(['.md','.js','.json','.py','.toml','.yml','.yaml','.txt','.svg']);
const findings = [];
const patterns = [
  ['private_monolith_path', /D:[\\/]Monolith/i],
  ['private_bridge_tool', new RegExp('Agent' + 'Bridge', 'i')],
  ['private_hermes', /\bHermes\b/i],
  ['private_fabrika', /\bfabrikalite\b/i],
  ['private_alice', /\balice-gpt\b/i],
  ['private_mediacontent', /\bmediacontent\b/i],
  ['github_token', /(?:ghp_|github_pat_)[A-Za-z0-9_]{12,}/],
  ['private_key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/]
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name);
    const rel = path.relative(root, file).replaceAll('\\', '/');
    if (excludedAnywhere.has(entry.name)) continue;
    if (!rel.includes('/') && excludedRootOnly.has(entry.name)) continue;
    if (entry.isDirectory()) walk(file);
    else if (textExt.has(path.extname(entry.name).toLowerCase()) || entry.name === 'LICENSE') {
      const content = fs.readFileSync(file, 'utf8');
      for (const [id, re] of patterns) {
        if (re.test(content)) findings.push({id, file: path.relative(root, file).replaceAll('\\', '/')});
      }
    }
  }
}
walk(root);
assert.deepEqual(findings, [], 'PRIVATE_LEAK_FINDINGS');

const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
const broken = [];
for (const rel of ['README.md','README.ru.md','LICENSING.md','docs/architecture.md','docs/getting-started.md','docs/provenance.md']) {
  const file = path.join(root, rel);
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = linkPattern.exec(content))) {
    const target = match[1].split('#', 1)[0].replace(/^<|>$/g, '');
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) broken.push(rel + ' -> ' + match[1]);
  }
}
assert.deepEqual(broken, [], 'BROKEN_ROOT_LINKS');

console.log(JSON.stringify({
  result: 'PASS',
  corpus_manifest_files: Object.keys(manifest.files).length,
  corpus_manifest_sha256: hash(path.join(corpus, 'MANIFEST_SHA256.json')),
  private_leak_findings: findings.length,
  broken_root_links: broken.length,
  nested_git: false
}));
