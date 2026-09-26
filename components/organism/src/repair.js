'use strict';

const homeostasis = require('./homeostasis');
const {demand, sha, seal, intact} = require('./shared');

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

function freeze(ctx, findingId, gates = {}) {
  demand(gates.ownerConfirmed === true, 'OWNER_CONFIRMATION_REQUIRED');
  demand(gates.localStartConfirmed === true, 'LOCAL_START_CONFIRMATION_REQUIRED');
  const report = homeostasis.inspect(ctx);
  const finding = report.findings.find(x => x.id === findingId && x.severity !== 'PASS');
  demand(finding, 'FINDING_NOT_ACTIVE');
  const body = {
    schema: 1,
    kind: 'lso_supervised_repair_contract',
    contractVersion: '0.2',
    projectId: ctx.projectId,
    projectRoot: ctx.root,
    findingId,
    finding: {...finding},
    source: {genomeSha256: report.fingerprints.genomeSha256, statusSha256: report.fingerprints.statusSha256,
      sourceSha256: report.fingerprints.sourceSha256, continuity: report.fingerprints.continuity,
      identity: report.fingerprints.identity},
    baselineFailIds: report.findings.filter(x => x.severity === 'FAIL').map(x => x.id).sort(),
    createdAt: new Date().toISOString(),
    state: 'FROZEN',
    execution: {automatic: false, executor: null, dispatch: false},
    gates: {ownerConfirmed: true, localStartConfirmed: true},
    contractOnly: true
  };
  return freezeDeep(seal(body));
}

function assertFresh(ctx, contract) {
  demand(validContract(contract, ctx), 'REPAIR_CONTRACT_INVALID');
  demand(contract.projectId === ctx.projectId, 'REPAIR_SCOPE_MISMATCH');
  const report = homeostasis.inspect(ctx);
  demand(report.fingerprints.genomeSha256 === contract.source.genomeSha256
    && report.fingerprints.statusSha256 === contract.source.statusSha256
    && sha(report.fingerprints.sourceSha256) === sha(contract.source.sourceSha256)
    && sha(report.fingerprints.continuity) === sha(contract.source.continuity)
    && sha(report.fingerprints.identity) === sha(contract.source.identity), 'REPAIR_CONTRACT_STALE');
  return report;
}

function validContract(contract, ctx) {
  return !!contract && typeof contract === 'object' && intact(contract)
    && contract.kind === 'lso_supervised_repair_contract' && contract.contractVersion === '0.2'
    && contract.state === 'FROZEN' && contract.contractOnly === true
    && contract.projectId === ctx.projectId && contract.projectRoot === ctx.root && contract.findingId
    && contract.gates && contract.gates.ownerConfirmed === true && contract.gates.localStartConfirmed === true
    && Array.isArray(contract.baselineFailIds) && contract.source && typeof contract.source === 'object';
}

function verify(ctx, contract) {
  if (!validContract(contract, ctx)) {
    return seal({schema: 1, kind: 'lso_repair_acceptance', result: 'REJECTED', projectId: ctx.projectId,
      projectRoot: ctx.root,
      findingId: contract && contract.findingId || null, contractSha256: null, sourceFindingResolved: false,
      newFailFindings: [], currentFingerprints: null, protocol: null, rejection: 'REPAIR_CONTRACT_INVALID',
      executorClaimUsedAsAcceptance: false, automaticExecution: false, authority: 'NON_AUTHORITATIVE_FRESH_VERIFICATION'});
  }
  let report;
  let rejection = null;
  try { report = homeostasis.inspect(ctx); }
  catch (error) { rejection = error.code || error.message || 'FRESH_HOMEOSTASIS_UNAVAILABLE'; }
  if (!report) report = {assessedAt: new Date().toISOString(), findings: [], fingerprints: {identity: null}};
  const source = report.findings.find(x => x.id === contract.findingId);
  const newFails = report.findings.filter(x => x.severity === 'FAIL' && !contract.baselineFailIds.includes(x.id)).map(x => x.id).sort();
  const accepted = !rejection && source && source.severity === 'PASS' && newFails.length === 0;
  return seal({schema: 1, kind: 'lso_repair_acceptance', result: accepted ? 'ACCEPTED' : 'REJECTED',
    projectId: ctx.projectId, findingId: contract.findingId, sourceFindingResolved: !!source && source.severity === 'PASS',
    projectRoot: ctx.root,
    contractSha256: contract.receipt_sha256, newFailFindings: newFails,
    currentFingerprints: report.fingerprints, protocol: report.fingerprints.identity,
    rejection, assessedAt: report.assessedAt,
    executorClaimUsedAsAcceptance: false, automaticExecution: false, authority: 'NON_AUTHORITATIVE_FRESH_VERIFICATION'});
}

module.exports = {freeze, assertFresh, verify, validContract};
