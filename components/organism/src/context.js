'use strict';
const path = require('node:path');
const {demand} = require('./shared');
const {confined, relative} = require('./paths');
function createContext({root, projectId, runtime = '.lso-runtime', adapter}) {
  demand(typeof root === 'string' && path.isAbsolute(root), 'EXPLICIT_ROOT_REQUIRED');
  demand(typeof projectId === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(projectId), 'PROJECT_ID_REQUIRED');
  relative(runtime);
  demand(adapter && typeof adapter.read === 'function', 'ADAPTER_REQUIRED');
  const ctx = {root: path.resolve(root), projectId, runtime, adapter};
  confined(ctx.root, runtime, true);
  demand(!['.git','.project-corpus','src','test','docs','examples'].includes(runtime.split('/')[0]), 'RUNTIME_CANONICAL_COLLISION');
  const state = adapter.read(ctx);
  demand(state && Array.isArray(state.sources) && Array.isArray(state.continuity), 'ADAPTER_CONTRACT');
  for (const item of [...state.sources, ...state.continuity]) {
    relative(item.path);
    demand(item.path !== runtime && !item.path.startsWith(runtime + '/') && !runtime.startsWith(item.path + '/'), 'RUNTIME_CANONICAL_COLLISION');
  }
  return Object.freeze(ctx);
}
module.exports = {createContext};
