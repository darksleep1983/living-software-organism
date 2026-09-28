'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {confined, relative} = require('./paths');
const {sha, fileHash, demand, seal, intact} = require('./shared');
function buildManifest(ctx) {
  const a = ctx.adapter.read(ctx), i = a.identity;
  const corpusAgreement = i.projectId === ctx.projectId && i.statusProjectId === ctx.projectId && !!i.protocol && i.protocol === i.statusProtocol;
  const policyAgreement = i.policyAgreement === true;
  const sources = a.sources.map(s => {
    relative(s.path);
    const full = confined(ctx.root, s.path, true), present = fs.existsSync(full);
    demand(!present || fs.lstatSync(full).isFile(), 'REGULAR_FILE_REQUIRED');
    return {id: s.id, path: s.path, relative_path: s.path, required: s.required, present, sha256: present ? fileHash(full) : null, size: present ? fs.statSync(full).size : null};
  });
  const metadataReady = ctx.adapter.kind !== 'project-corpus-v2-reference'
    || (Array.isArray(i.metadataIssues) && i.metadataIssues.length === 0 && i.activeTaskId != null);
  const ready = corpusAgreement && policyAgreement && metadataReady && sources.every(s => !s.required || s.present);
  const projection = {project_id: ctx.projectId, physical_root: ctx.root, identity: i, sources, continuity: a.continuity};
  return {...projection, kind: 'recovery_manifest', scope: ctx.projectId, physical_root: ctx.root,
    identity: {...i, corpus_agreement: corpusAgreement, policy_agreement: policyAgreement},
    authority: 'NON_AUTHORITATIVE_RECOVERY_READINESS_MANIFEST',
    readiness: {canonical_substrate: !ready ? 'NOT_READY' : a.continuity.every(d => d.present) ? 'READY' : 'PARTIAL', full_application_runtime_recovery: 'UNPROVEN', restore_authorized: false},
    source_fingerprint_sha256: sha(projection), dependency_declarations: {runtime: 'UNDECLARED', build: 'UNDECLARED', non_versioned: 'UNDECLARED'}, restore_authorized: false};
}
function inventory(root) {
  const out = [];
  function walk(ref) {
    const dir = ref ? confined(root, ref) : root;
    for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
      const r = ref ? ref + '/' + e.name : e.name;
      const full = confined(root, r);
      if (fs.lstatSync(full).isDirectory()) walk(r); else { demand(fs.lstatSync(full).isFile(), 'REGULAR_FILE_REQUIRED'); out.push(r); }
    }
  }
  walk(''); return out.sort();
}
function rehearse(ctx) {
  const before = buildManifest(ctx);
  demand(before.readiness.canonical_substrate !== 'NOT_READY', 'SUBSTRATE_NOT_READY');
  const ref = ctx.runtime + '/rehearsals/' + crypto.randomBytes(12).toString('hex');
  const dir = confined(ctx.root, ref, true); fs.mkdirSync(dir, {recursive: true});
  const payloadRef = ref + '/payload'; fs.mkdirSync(confined(ctx.root, payloadRef, true));
  for (const source of before.sources.filter(s => s.present)) {
    const destRef = payloadRef + '/' + source.path;
    fs.mkdirSync(path.dirname(confined(ctx.root, destRef, true)), {recursive: true});
    fs.copyFileSync(confined(ctx.root, source.path), confined(ctx.root, destRef, true), fs.constants.COPYFILE_EXCL);
  }
  for (const d of before.continuity) fs.mkdirSync(confined(ctx.root, payloadRef + '/' + d.path, true), {recursive: true});
  const after = buildManifest(ctx);
  demand(before.source_fingerprint_sha256 === after.source_fingerprint_sha256, 'STALE_SOURCE');
  const receipt = seal({kind: 'recovery_rehearsal', project_id: ctx.projectId, physical_root: ctx.root, manifest_sha256: before.source_fingerprint_sha256, sources: before.sources.filter(s => s.present), continuity: before.continuity, payload: payloadRef, restore_authorized: false, isolated_only: true});
  const receiptRef = ref + '/receipt.json'; fs.writeFileSync(confined(ctx.root, receiptRef, true), JSON.stringify(receipt, null, 2) + '\n', {flag: 'wx'});
  demand(intact(JSON.parse(fs.readFileSync(confined(ctx.root, receiptRef), 'utf8'))), 'READBACK_FAILED');
  return {receipt: receiptRef, ...verifyRehearsal(ctx, receiptRef)};
}
function verifyRehearsal(ctx, receiptRef) {
  relative(receiptRef); demand(receiptRef.startsWith(ctx.runtime + '/rehearsals/'), 'RUNTIME_BOUNDARY');
  let receipt;
  try {
    receipt = JSON.parse(fs.readFileSync(confined(ctx.root, receiptRef), 'utf8'));
    demand(intact(receipt) && receipt.kind === 'recovery_rehearsal' && receipt.project_id === ctx.projectId && receipt.physical_root === ctx.root && receipt.restore_authorized === false && receipt.isolated_only === true, 'TAMPERED');
    demand(receipt.payload === receiptRef.slice(0, -'receipt.json'.length) + 'payload', 'PAYLOAD_BINDING');
    const payload = confined(ctx.root, receipt.payload);
    demand(sha(inventory(payload)) === sha(receipt.sources.map(s => s.path).sort()), 'INVENTORY_TAMPERED');
    for (const s of receipt.sources) { const f = confined(payload, s.path); demand(fileHash(f) === s.sha256 && fs.statSync(f).size === s.size, 'PAYLOAD_TAMPERED'); }
    for (const d of receipt.continuity) demand(fs.lstatSync(confined(payload, d.path)).isDirectory(), 'CONTINUITY_TAMPERED');
  } catch (error) { return {result: 'FAIL_TAMPERED', reason: error.message, restore_authorized: false}; }
  return {result: buildManifest(ctx).source_fingerprint_sha256 === receipt.manifest_sha256 ? 'PASS' : 'STALE_SOURCE', restore_authorized: false};
}
module.exports = {buildManifest, rehearse, verifyRehearsal, stableSha: sha, receiptHash: value => seal(value).receipt_sha256};
