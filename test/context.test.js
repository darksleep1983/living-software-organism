'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {fixture} = require('./helpers');
const {createContext} = require('../src/context');
test('explicit identity, adapter and safe runtime boundary are mandatory', () => {
  const f = fixture();
  try {
    assert.throws(() => createContext({root: '.', projectId: 'fixture', adapter: f.ctx.adapter}), /EXPLICIT_ROOT_REQUIRED/);
    assert.throws(() => createContext({root: f.root, projectId: '../other', adapter: f.ctx.adapter}), /PROJECT_ID_REQUIRED/);
    assert.throws(() => createContext({root: f.root, projectId: 'fixture'}), /ADAPTER_REQUIRED/);
    for (const runtime of ['../outside','/outside','x\\y','x:stream','src/cache','.project-corpus/cache','.git/cache']) assert.throws(() => createContext({...f.ctx, runtime}));
    const adapter = {read: () => ({sources: [{path: 'cache/source.md'}], continuity: []})};
    assert.throws(() => createContext({root: f.root, projectId: 'fixture', runtime: 'cache', adapter}), /RUNTIME_CANONICAL_COLLISION/);
    const {relative} = require('../src/paths');
    for (const ref of ['NUL','con.txt','a./file','a /file','a\u0000b','a\nfile']) assert.throws(() => relative(ref), /UNSAFE_PATH/);
  } finally { f.cleanup(); }
});
