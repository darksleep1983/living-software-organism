'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
function demand(ok, code) { if (!ok) throw new Error(code); }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return value;
}
function sha(value) { return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex'); }
function fileHash(file) {
  const hash = crypto.createHash('sha256');
  const chunk = Buffer.allocUnsafe(64 * 1024);
  const fd = fs.openSync(file, 'r');
  try {
    for (;;) {
      const count = fs.readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      hash.update(chunk.subarray(0, count));
    }
    return hash.digest('hex');
  } finally {
    fs.closeSync(fd);
  }
}
function seal(value) { const copy = {...value}; delete copy.receipt_sha256; return {...copy, receipt_sha256: sha(copy)}; }
function intact(value) { if (!value || typeof value !== 'object') return false; const copy = {...value}; delete copy.receipt_sha256; return value.receipt_sha256 === sha(copy); }
module.exports = {demand, stable, sha, fileHash, seal, intact};
