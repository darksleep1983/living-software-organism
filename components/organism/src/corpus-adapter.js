'use strict';
const fs = require('node:fs');
const {confined} = require('./paths');
const {fileHash, sha, demand} = require('./shared');
const {parseMetadata} = require('./corpus-metadata');
function scalar(text, key) { const match = text.match(new RegExp('^' + key + '\\s*=\\s*"([^"]+)"', 'm')); return match ? match[1] : null; }
function projectCorpusAdapter() {
  return Object.freeze({kind: 'project-corpus-v2-reference', read(ctx) {
    const sources = [];
    const read = (id, ref) => {
      const file = confined(ctx.root, ref, true);
      const present = fs.existsSync(file);
      demand(!present || fs.lstatSync(file).isFile(), 'REGULAR_FILE_REQUIRED');
      sources.push({id, path: ref, required: true, present, sha256: present ? fileHash(file) : null, size: present ? fs.statSync(file).size : null});
      return present ? fs.readFileSync(file, 'utf8') : '';
    };
    read('AGENTS', 'AGENTS.md');
    const project = read('PROJECT', '.project-corpus/state/PROJECT.md');
    const status = read('STATUS', '.project-corpus/state/STATUS.md');
    const policy = read('POLICY', '.project-corpus/policy.toml');
    const projectMeta = parseMetadata(project, 'PROJECT');
    const statusMeta = parseMetadata(status, 'STATUS');
    const active = statusMeta.values['Active-Task-ID'] || null;
    if (active && active !== 'NONE') {
      demand(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(active), 'UNSAFE_TASK_ID');
      read('ACTIVE_TASK', '.project-corpus/tasks/' + active + '.md');
    }
    const continuity = ['tasks', 'reports', 'history'].map(name => {
      const ref = '.project-corpus/' + name, file = confined(ctx.root, ref, true);
      return {path: ref, present: fs.existsSync(file) && fs.lstatSync(file).isDirectory()};
    });
    return {identity: {projectId: projectMeta.values['Project-ID'] || null, statusProjectId: statusMeta.values['Project-ID'] || null, protocol: projectMeta.values['Protocol-Version'] || null, statusProtocol: statusMeta.values['Protocol-Version'] || null, policyProjectId: scalar(policy, 'project_id'), policyVersion: scalar(policy, 'policy_version'), policyAgreement: scalar(policy, 'project_id') === ctx.projectId && scalar(policy, 'policy_version') === '2.0', activeTaskId: active, lifecycle: statusMeta.values['Lifecycle-Status'] || null, metadataIssues: [...projectMeta.issues.map(x => `PROJECT:${x}`), ...statusMeta.issues.map(x => `STATUS:${x}`)]}, sources, continuity,
      genome_sha256: sha(sources.filter(s => ['AGENTS','PROJECT','POLICY'].includes(s.id))), status_sha256: sources.find(s => s.id === 'STATUS').sha256};
  }});
}
module.exports = {projectCorpusAdapter};
