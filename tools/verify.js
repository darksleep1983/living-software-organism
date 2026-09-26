'use strict';

const {spawnSync} = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const corpus = path.join(root, 'components', 'project-corpus');
const organism = path.join(root, 'components', 'organism');
const python = process.env.PYTHON || 'python';

function run(label, command, args, cwd, env = {}) {
  process.stdout.write('\n== ' + label + ' ==\n');
  const result = spawnSync(command, args, {
    cwd,
    env: {...process.env, ...env},
    stdio: 'inherit',
    shell: false
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(label + ' failed with exit ' + result.status);
    process.exit(result.status || 1);
  }
}

run('Project Corpus tests', python, ['-m','unittest','discover','-s','tests','-v'], corpus, {
  PYTHONPATH: path.join(corpus, 'src')
});

for (const file of ['context.test.js','recovery.test.js','stable.test.js','experimental.test.js']) {
  run('Organism ' + file, process.execPath, [path.join('test', file)], organism);
}

run('Organism smoke', process.execPath, [path.join('examples','smoke.js')], organism);
run('Organism static checks', process.execPath, [path.join('scripts','check.js')], organism);
run('Full-stack integration', process.execPath, [path.join('examples','full-stack','smoke.js')], root);
run('Unified repository checks', process.execPath, [path.join('tools','check.js')], root);

console.log('\nUNIFIED_VERIFY_PASS');
