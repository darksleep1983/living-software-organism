'use strict';

const {demand} = require('./shared');

function finding(id, severity, summary, detail) {
  const out = {id, severity, summary};
  if (detail !== undefined && detail !== null) out.detail = detail;
  return out;
}

function readAdapter(ctx) {
  demand(ctx && ctx.adapter && typeof ctx.adapter.read === 'function', 'ADAPTER_REQUIRED');
  const view = ctx.adapter.read(ctx);
  demand(view && typeof view === 'object' && !Array.isArray(view), 'ADAPTER_RESULT_INVALID');
  demand(Array.isArray(view.sources) && view.sources.length > 0
    && view.sources.some(source => source && source.required === true), 'ADAPTER_SOURCE_EVIDENCE_REQUIRED');
  for (const source of view.sources) {
    demand(source && typeof source.id === 'string' && typeof source.path === 'string'
      && typeof source.present === 'boolean', 'ADAPTER_SOURCE_INVALID');
    if (source.present) demand(typeof source.sha256 === 'string' && /^[a-f0-9]{64}$/i.test(source.sha256)
      && Number.isFinite(source.size) && source.size >= 0, 'ADAPTER_SOURCE_FINGERPRINT_INVALID');
  }
  for (const hash of [view.genome_sha256, view.status_sha256]) {
    if (hash != null) demand(typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash), 'ADAPTER_FINGERPRINT_INVALID');
  }
  return view;
}

function inspect(ctx) {
  const view = readAdapter(ctx);
  const findings = [];
  const sources = Array.isArray(view.sources) ? view.sources : [];
  const continuity = Array.isArray(view.continuity) ? view.continuity : [];
  const identity = view.identity || {};
  if (ctx.adapter.kind === 'project-corpus-v2-reference') {
    const metadataIssues = Array.isArray(identity.metadataIssues) ? identity.metadataIssues : ['METADATA_EVIDENCE_MISSING'];
    findings.push(finding('PROTOCOL_METADATA', metadataIssues.length ? 'FAIL' : 'PASS',
      metadataIssues.length ? 'Required Project Corpus V2 metadata or sections are invalid.' : 'Project Corpus V2 metadata and sections conform.',
      metadataIssues.length ? metadataIssues.slice(0, 16).join(', ') : undefined));
  }
  const missing = sources.filter(x => x && x.required && x.present !== true);
  findings.push(finding('REQUIRED_SOURCES', missing.length ? 'FAIL' : 'PASS',
    missing.length ? 'Required project sources are unavailable.' : 'Required project sources are present.',
    missing.length ? missing.map(x => x.id || x.path).join(', ') : undefined));

  const hasCorpusPolicy = identity.policyProjectId != null || identity.policyVersion != null;
  const policyMismatch = identity.policyAgreement != null
    ? identity.policyAgreement !== true
    : !hasCorpusPolicy || identity.policyProjectId !== ctx.projectId || identity.policyVersion !== '2.0';
  const identityMismatch = identity.projectId !== ctx.projectId
    || identity.statusProjectId !== ctx.projectId
    || !identity.protocol || identity.protocol !== identity.statusProtocol
    || policyMismatch;
  findings.push(finding('IDENTITY_CONTINUITY', identityMismatch ? 'FAIL' : 'PASS',
    identityMismatch ? 'Project identity or continuity protocol is inconsistent.' : 'Project identity and declared continuity protocol agree.',
    identityMismatch ? 'Compare project id, status project id, protocol fields, and any supplied policy identity.' : undefined));

  const activeTask = identity.activeTaskId == null && ctx.adapter.kind !== 'project-corpus-v2-reference'
    ? 'NONE' : identity.activeTaskId;
  const taskPresent = activeTask === 'NONE' || (typeof activeTask === 'string' && sources.some(x => x && x.present === true
    && (x.id === `task:${activeTask}` || x.id === activeTask || x.path === `.project-corpus/tasks/${activeTask}.md`)));
  findings.push(finding('ACTIVE_TASK', taskPresent ? 'PASS' : 'FAIL',
    taskPresent ? (activeTask === 'NONE' ? 'No active task is declared.' : 'The declared active task is present.') : 'The declared active task cannot be found in fresh adapter evidence.',
    taskPresent ? undefined : activeTask));

  const missingContinuity = continuity.filter(x => x && x.present !== true);
  findings.push(finding('CONTINUITY', missingContinuity.length ? 'WARN' : 'PASS',
    missingContinuity.length ? 'Optional continuity locations are missing.' : 'Declared continuity locations are present.',
    missingContinuity.length ? missingContinuity.map(x => x.path).join(', ') : undefined));

  const fails = findings.filter(x => x.severity === 'FAIL').length;
  const warns = findings.filter(x => x.severity === 'WARN').length;
  return {
    schema: 1,
    kind: 'lso_homeostasis_report',
    contractVersion: '0.1',
    assessedAt: new Date().toISOString(),
    projectId: ctx.projectId,
    projectRoot: ctx.root,
    authority: 'NON_AUTHORITATIVE_DERIVED_HEALTH',
    state: fails ? 'UNHEALTHY' : warns ? 'DEGRADED' : 'STABLE',
    driftDetected: fails + warns > 0,
    counts: {pass: findings.length - fails - warns, warn: warns, fail: fails},
    fingerprints: {
      genomeSha256: view.genome_sha256 || null,
      statusSha256: view.status_sha256 || null,
      sourceSha256: sources.map(x => ({id: x.id, sha256: x.sha256 || null, present: x.present === true})),
      continuity: continuity.map(x => ({path: x.path, present: x.present === true})),
      projectRoot: ctx.root,
      identity: {projectId: identity.projectId || null, statusProjectId: identity.statusProjectId || null,
        protocol: identity.protocol || null, statusProtocol: identity.statusProtocol || null}
    },
    findings,
    repairIntents: findings.filter(x => x.severity !== 'PASS').map(x => ({findingId: x.id, mode: 'PROPOSAL_ONLY', executionAuthorized: false})),
    guarantees: {readOnlyAssessment: true, automaticRepair: false, authorityChange: false, externalAction: false}
  };
}

module.exports = {inspect};
