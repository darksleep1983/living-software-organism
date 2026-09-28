'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {confined} = require('./paths');
const {demand, sha} = require('./shared');
const homeostasis = require('./homeostasis');

const MAX_SNAPSHOTS = 256;
const MAX_FINDINGS = 64;

function historyPath(ctx, missing = true) {
  const relative = `${ctx.runtime}/health-history/${ctx.projectId}.jsonl`;
  return confined(ctx.root, relative, missing);
}

function read(ctx) {
  const file = historyPath(ctx, true);
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  demand(lines.length <= MAX_SNAPSHOTS, 'HISTORY_LIMIT_EXCEEDED');
  return lines.map(line => {
    let value;
    try { value = JSON.parse(line); } catch { throw new Error('HISTORY_RECORD_INVALID'); }
    demand(value && value.kind === 'lso_health_snapshot' && value.projectId === ctx.projectId
      && typeof value.stateDigestSha256 === 'string', 'HISTORY_RECORD_INVALID');
    return value;
  });
}

function compactFindings(report) {
  const selected = (report && Array.isArray(report.findings) ? report.findings : [])
    .filter(x => x && x.severity !== 'PASS').slice(0, MAX_FINDINGS)
    .map(x => ({id: String(x.id).slice(0, 128), severity: String(x.severity).slice(0, 16)}))
    .sort((a, b) => a.id.localeCompare(b.id));
  return Array.from(new Map(selected.map(x => [x.id, x])).values());
}

function projection(views) {
  const home = views.homeostasis || {};
  const metabolism = views.metabolism || {};
  const immune = views.immuneMemory || {};
  const budgets = Array.isArray(metabolism.budgets) ? metabolism.budgets.slice(0, 64) : [];
  const lessons = Array.isArray(immune.lessons) ? immune.lessons.slice(0, 64) : [];
  return {
    homeostasis: {state: home.state || home.homeostasis && home.homeostasis.state || 'UNKNOWN', findings: compactFindings(home)},
    metabolism: {state: metabolism.state || metabolism.metabolism && metabolism.metabolism.state || 'UNKNOWN',
      requiresOwnerDecision: metabolism.requires_owner_decision === true || metabolism.metabolism && metabolism.metabolism.requires_owner_decision === true,
      budgets: budgets.map(x => ({id: String(x.budget_id || x.id || '').slice(0, 128), state: String(x.state || 'UNKNOWN').slice(0, 24), ownerDecision: x.requires_owner_decision === true}))},
    immuneMemory: {lessons: lessons.map(x => ({id: String(x.lesson_id || x.id || '').slice(0, 128), freshness: ['CURRENT','STALE'].includes(x.freshness && x.freshness.state || x.freshness) ? (x.freshness && x.freshness.state || x.freshness) : 'UNKNOWN'}))}
  };
}

function capture(ctx, views) {
  demand(views && typeof views === 'object', 'HISTORY_VIEWS_REQUIRED');
  for (const key of ['homeostasis', 'metabolism', 'immuneMemory']) {
    const supplied = views[key];
    if (supplied) demand(supplied.projectId === ctx.projectId, 'HISTORY_VIEW_SCOPE_MISMATCH');
    if (supplied && supplied.projectRoot != null) demand(supplied.projectRoot === ctx.root, 'HISTORY_VIEW_SCOPE_MISMATCH');
  }
  const adapter = ctx.adapter.read(ctx), identity = adapter.identity || {};
  demand(identity.projectId === ctx.projectId && identity.statusProjectId === ctx.projectId
    && identity.protocol && identity.protocol === identity.statusProtocol, 'HISTORY_IDENTITY_UNVERIFIED');
  if (identity.policyAgreement != null) demand(identity.policyAgreement === true, 'HISTORY_POLICY_UNVERIFIED');
  const freshHomeostasis = homeostasis.inspect(ctx);
  const file = historyPath(ctx, true);
  const prior = read(ctx);
  const state = projection({...views, homeostasis: freshHomeostasis});
  const sourceFingerprints = {genomeSha256: adapter.genome_sha256 || null, statusSha256: adapter.status_sha256 || null,
    protocol: identity.protocol, statusProtocol: identity.statusProtocol};
  const digest = sha({state, source: {genomeSha256: sourceFingerprints.genomeSha256,
    protocol: sourceFingerprints.protocol, statusProtocol: sourceFingerprints.statusProtocol}});
  if (prior.length && prior[prior.length - 1].stateDigestSha256 === digest) {
    return {kind: 'lso_health_history_capture', result: 'SKIPPED_UNCHANGED', projectId: ctx.projectId,
      stateDigestSha256: digest, writePerformed: false, authority: 'NON_AUTHORITATIVE_RECORDED_HEALTH'};
  }
  const snapshot = {schema: 1, kind: 'lso_health_snapshot', contractVersion: '0.6',
    projectId: ctx.projectId, capturedAt: new Date().toISOString(), stateDigestSha256: digest, state,
    sourceFingerprints,
    previousSnapshotId: prior.length ? prior[prior.length - 1].snapshotId : null,
    snapshotId: `health_${Date.now().toString(36)}_${digest.slice(0, 12)}`,
    guarantees: {recordedSnapshotsOnly: true, causalDiagnosis: false, prediction: false, automaticPolling: false,
      automaticRepair: false, rawContentStored: false, authority: false}};
  const bounded = prior.concat(snapshot).slice(-MAX_SNAPSHOTS);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  // Re-check after directory creation to catch links introduced between check and write.
  const checked = historyPath(ctx, true);
  demand(path.resolve(file) === path.resolve(checked), 'HISTORY_PATH_CHANGED');
  const payload = bounded.map(x => JSON.stringify(x)).join('\n') + '\n';
  const tempRef = `${ctx.runtime}/health-history/.${ctx.projectId}.${crypto.randomBytes(12).toString('hex')}.tmp`;
  const temp = confined(ctx.root, tempRef, true);
  let created = false;
  try {
    const fd = fs.openSync(temp, 'wx');
    created = true;
    try {
      fs.writeFileSync(fd, payload, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    demand(fs.readFileSync(confined(ctx.root, tempRef), 'utf8') === payload, 'HISTORY_READBACK_FAILED');
    demand(path.resolve(historyPath(ctx, true)) === path.resolve(file), 'HISTORY_PATH_CHANGED');
    fs.renameSync(confined(ctx.root, tempRef), historyPath(ctx, true));
    created = false;
    demand(fs.readFileSync(historyPath(ctx), 'utf8') === payload, 'HISTORY_READBACK_FAILED');
  } catch (error) {
    if (created) {
      const checkedTemp = confined(ctx.root, tempRef);
      fs.unlinkSync(checkedTemp);
    }
    throw error;
  }
  return {kind: 'lso_health_history_capture', result: 'WRITTEN', projectId: ctx.projectId,
    snapshotId: snapshot.snapshotId, stateDigestSha256: digest, writePerformed: true,
    retainedSnapshots: bounded.length, authority: 'NON_AUTHORITATIVE_RECORDED_HEALTH'};
}

function trends(ctx) {
  const snapshots = read(ctx);
  const count = pred => snapshots.filter(pred).length;
  const recurring = new Map();
  for (const snapshot of snapshots) for (const item of snapshot.state.homeostasis.findings || []) {
    recurring.set(item.id, (recurring.get(item.id) || 0) + 1);
  }
  const transitions = [];
  for (let i = 1; i < snapshots.length; i++) {
    for (const dim of ['homeostasis', 'metabolism']) {
      const before = snapshots[i - 1].state[dim].state, after = snapshots[i].state[dim].state;
      if (before !== after) transitions.push({dimension: dim, from: before, to: after, at: snapshots[i].capturedAt});
    }
  }
  return {kind: 'lso_health_trends', projectId: ctx.projectId,
    historyState: snapshots.length === 0 ? 'EMPTY' : snapshots.length === 1 ? 'SINGLE_SNAPSHOT' : 'LONGITUDINAL',
    totalSnapshots: snapshots.length,
    repeatedDegradationSnapshots: count(x => ['DEGRADED', 'UNHEALTHY'].includes(x.state.homeostasis.state)),
    recurringFindings: Array.from(recurring, ([id, snapshotCount]) => ({id, snapshotCount, recurrenceIsNotCausation: true})).filter(x => x.snapshotCount >= 2),
    pressureSnapshots: count(x => ['PRESSURE', 'LIMIT'].includes(x.state.metabolism.state)), transitions,
    guarantees: {recordedSnapshotsOnly: true, causalDiagnosis: false, unobservedContinuity: false, prediction: false}};
}

module.exports = {capture, trends, MAX_SNAPSHOTS};
