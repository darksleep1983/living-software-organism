'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {demand} = require('./shared');
function relative(ref) {
  demand(typeof ref === 'string' && ref.length > 0 && ref.length < 1024, 'PATH_REQUIRED');
  demand(!/[\\:\x00-\x1f]/.test(ref) && !ref.startsWith('/'), 'UNSAFE_PATH');
  demand(ref.split('/').every(p => p && p !== '.' && p !== '..' && !/[. ]$/.test(p) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'UNSAFE_PATH');
  return ref;
}
function inside(root, target) { const r = path.resolve(root), t = path.resolve(target); return t === r || t.startsWith(r + path.sep); }
function confined(root, ref, missing = false) {
  relative(ref);
  const base = path.resolve(root);
  demand(fs.realpathSync(base) === base, 'ROOT_LINK');
  let current = base;
  const parts = ref.split('/');
  for (let i = 0; i < parts.length; i++) {
    const parent = current, part = parts[i];
    current = path.join(parent, part);
    // Parent Dirent classification also detects reparse points hidden from
    // lstat/realpath in restricted Windows contexts. Unknown types fail closed.
    let entry;
    try { entry = fs.readdirSync(parent, {withFileTypes: true}).find(e => e.name === part); }
    catch { throw new Error('PATH_CLASSIFICATION_FAILED'); }
    demand(!entry || !entry.isSymbolicLink(), 'LINK_REJECTED');
    demand(!entry || entry.isDirectory() || entry.isFile(), 'PATH_CLASSIFICATION_FAILED');
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) {
      demand(error.code === 'ENOENT' && missing && !entry, 'MISSING_FILE');
      return path.join(current, ...parts.slice(i + 1));
    }
    demand(entry, 'PATH_CLASSIFICATION_FAILED');
    demand(!stat.isSymbolicLink(), 'LINK_REJECTED');
    demand(entry.isDirectory() === stat.isDirectory() && entry.isFile() === stat.isFile(), 'PATH_CLASSIFICATION_FAILED');
    demand(inside(base, fs.realpathSync(current)), 'PATH_ESCAPE');
    if (i < parts.length - 1) demand(stat.isDirectory(), 'DIRECTORY_REQUIRED');
  }
  return current;
}
module.exports = {relative, inside, confined};
