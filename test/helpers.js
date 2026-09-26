'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createContext} = require('../src/context');
const {projectCorpusAdapter} = require('../src/corpus-adapter');
function fixture() {
  const base = path.resolve(__dirname, '../.lso-runtime'); fs.mkdirSync(base, {recursive: true});
  const root = fs.mkdtempSync(path.join(base, 'fixture-'));
  function write(ref, text) { const f = path.join(root, ref); fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, text); }
  write('AGENTS.md', '# Project-local authority\n');
  write('.project-corpus/state/PROJECT.md', 'Protocol-Version: 2.0\nProject-ID: fixture\n');
  write('.project-corpus/state/STATUS.md', 'Protocol-Version: 2.0\nProject-ID: fixture\nLifecycle-Status: ACTIVE\nActive-Task-ID: NONE\n');
  write('.project-corpus/policy.toml', 'policy_version = "2.0"\nproject_id = "fixture"\n');
  for (const d of ['tasks','reports','history']) fs.mkdirSync(path.join(root, '.project-corpus', d));
  return {root, write, ctx: createContext({root, projectId: 'fixture', adapter: projectCorpusAdapter()}), cleanup() { fs.rmSync(root, {recursive: true}); if (fs.existsSync(root)) throw new Error('FIXTURE_CLEANUP_DEBT'); }};
}
module.exports = {fixture};
