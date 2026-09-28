'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    if (['.git','.project-corpus','.lso-runtime','node_modules'].includes(e.name)) continue;
    const full = path.join(dir, e.name); assert(!e.isSymbolicLink(), 'PUBLIC_TREE_LINK');
    if (e.isDirectory()) walk(full); else files.push(full);
  }
}
walk(root);
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
assert.equal(packageJson.name, 'living-software-organism');
assert(packageJson.private !== true && packageJson.version === '0.1.0-rc.3' && packageJson.license === 'MIT');
assert(packageJson.bin && packageJson.bin.lso === 'cli.js');
assert(!packageJson.dependencies && !packageJson.devDependencies);
assert(fs.existsSync(path.join(root, 'cli.js')) && fs.existsSync(path.join(root,'schemas','lso.config.schema.json')) && fs.existsSync(path.join(root,'templates','v2','minimal','.project-corpus','state','PROJECT.md')));
assert(fs.existsSync(path.join(root, 'LICENSE')), 'MIT_LICENSE_MISSING');
const forbidden = [new RegExp('D:[\\\\/]Mon' + 'olith', 'i'), new RegExp('C:[\\\\/]Users[\\\\/]', 'i'), /(?:sk|ghp|github_pat)-[A-Za-z0-9_]{20,}/, /-----BEGIN (?:RSA |OPENSSH )?PRIVATE KEY-----/];
for (const full of files) {
  const text = fs.readFileSync(full, 'utf8');
  for (const pattern of forbidden) assert(!pattern.test(text), 'PRIVATE_CONTENT:' + path.relative(root, full));
  assert(!text.includes('*** Add ' + 'File:'), 'PATCH_DEBRIS');
  if (full.endsWith('.json')) JSON.parse(text);
  if (full.endsWith('.md')) {
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const ref = match[1].split('#')[0];
      if (ref && !/^[a-z]+:/i.test(ref)) assert(fs.existsSync(path.resolve(path.dirname(full), ref)), 'BROKEN_LINK:' + ref);
    }
  }
  if (path.relative(root, full).startsWith('src' + path.sep)) {
    for (const pattern of [/child_process/, /require\(['"](?:node:)?(?:net|http|https|tls|dgram)['"]\)/, /\b(?:setInterval|setTimeout|fetch)\s*\(/, /\b(?:rmSync|unlinkSync|rmdirSync)\s*\(/, /control_plane/, /graphRoot/]) assert(!pattern.test(text), 'FORBIDDEN_CORE_SURFACE:' + path.basename(full));
    for (const match of text.matchAll(/require\(['"]([^'"]+)['"]\)/g)) {
      const ref = match[1];
      if (ref.startsWith('.')) assert(path.resolve(path.dirname(full), ref).startsWith(path.join(root, 'src') + path.sep), 'PARENT_DEPENDENCY');
      else assert(['fs','path','crypto','node:fs','node:path','node:crypto'].includes(ref), 'UNDECLARED_DEPENDENCY');
    }
  }
}
for (const label of ['README.md','README.ru.md']) {
  const text = fs.readFileSync(path.join(root, label), 'utf8');
  assert(text.includes('v0.7') && text.includes('MIT License'));
}
console.log(JSON.stringify({result: 'PASS', public_files: files.length, checks: ['links','json','metadata','leak_patterns','core_imports','no_execution_network_polling_delete','maturity_license']}));
