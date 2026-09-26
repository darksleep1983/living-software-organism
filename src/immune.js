'use strict';

const repair = require('./repair');
const path = require('node:path');
const {demand, sha, seal, intact, fileHash} = require('./shared');
function strategy() { return {kind: 'contract_only', implementationSha256: sha(['repair.js','capabilities.js','immune.js'].map(name => fileHash(path.join(__dirname, name))))}; }

function lesson(ctx, candidate, acceptanceChain) {
  const chain = acceptanceChain || {};
  demand(candidate && typeof candidate === 'object', 'LESSON_CANDIDATE_REQUIRED');
  demand(candidate.projectId === ctx.projectId && candidate.projectRoot === ctx.root, 'LESSON_SCOPE_MISMATCH');
  demand(intact(chain.repairContract) && intact(chain.acceptance), 'ACCEPTANCE_CHAIN_INVALID');
  demand(chain.acceptance.kind === 'lso_repair_acceptance' && chain.acceptance.result === 'ACCEPTED', 'ACCEPTED_EVIDENCE_REQUIRED');
  demand(chain.acceptance.projectId === ctx.projectId
    && chain.acceptance.projectRoot === ctx.root
    && chain.acceptance.findingId === chain.repairContract.findingId, 'ACCEPTANCE_CHAIN_SCOPE_MISMATCH');
  const fresh = repair.verify(ctx, chain.repairContract);
  demand(intact(fresh) && fresh.result === 'ACCEPTED'
    && chain.acceptance.contractSha256 === chain.repairContract.receipt_sha256
    && chain.acceptance.contractSha256 === fresh.contractSha256
    && sha(chain.acceptance.currentFingerprints) === sha(fresh.currentFingerprints)
    && sha(chain.acceptance.protocol) === sha(fresh.protocol), 'ACCEPTANCE_EVIDENCE_STALE');
  const sourceSha = candidate.source || {};
  demand(sourceSha.genomeSha256 === chain.repairContract.source.genomeSha256
    && sourceSha.statusSha256 === chain.repairContract.source.statusSha256, 'LESSON_CANDIDATE_STALE');
  const acceptedSource = fresh.currentFingerprints;
  const statement = String(candidate.statement || '').slice(0, 500);
  const boundStrategy = strategy();
  const signature = sha({projectId: ctx.projectId, findingId: chain.repairContract.findingId, statement, strategy: boundStrategy, genome: acceptedSource.genomeSha256, protocol: fresh.protocol});
  return seal({schema: 1, kind: 'lso_immune_memory_lesson', contractVersion: '0.4',
    projectId: ctx.projectId, projectRoot: ctx.root, findingId: chain.repairContract.findingId,
    statement, signatureSha256: signature,
    strategy: boundStrategy,
    source: {genomeSha256: acceptedSource.genomeSha256, statusSha256: acceptedSource.statusSha256,
      protocol: fresh.protocol},
    acceptanceSha256: chain.acceptance.receipt_sha256, repairContractSha256: chain.repairContract.receipt_sha256,
    evidenceContractHashes: [chain.repairContract.receipt_sha256],
    freshness: {state: 'CURRENT', verifiedAt: fresh.assessedAt}, evidenceCount: 1, reinforcement: 'SINGLE',
    promotion: {status: 'CANDIDATE_ONLY', automatic: false, canonicalWrite: false},
    authority: 'NON_AUTHORITATIVE_IMMUNE_MEMORY'});
}

function reinforce(ctx, existing, candidate, acceptanceChain) {
  demand(intact(existing) && existing.kind === 'lso_immune_memory_lesson'
    && existing.projectId === ctx.projectId && existing.projectRoot === ctx.root
    && Array.isArray(existing.evidenceContractHashes) && existing.evidenceContractHashes.length === existing.evidenceCount,
    'LESSON_INVALID');
  demand(freshness(ctx, existing).state === 'CURRENT', 'LESSON_STALE');
  const verified = lesson(ctx, candidate, acceptanceChain);
  demand(existing.signatureSha256 === verified.signatureSha256
    && existing.findingId === verified.findingId, 'LESSON_SIGNATURE_MISMATCH');
  demand(existing.source.genomeSha256 === verified.source.genomeSha256
    && existing.source.statusSha256 === verified.source.statusSha256
    && sha(existing.source.protocol) === sha(verified.source.protocol), 'LESSON_SOURCE_MISMATCH');
  if (existing.evidenceContractHashes.includes(verified.repairContractSha256)) return existing;
  const evidenceContractHashes = existing.evidenceContractHashes.concat(verified.repairContractSha256);
  return seal({...existing, evidenceContractHashes, evidenceCount: evidenceContractHashes.length,
    reinforcement: 'REPEATED', acceptanceSha256: verified.acceptanceSha256,
    lastReinforcedAt: verified.freshness.verifiedAt,
    freshness: verified.freshness, promotion: {status: 'CANDIDATE_ONLY', automatic: false, canonicalWrite: false}});
}

function freshness(ctx, value) {
  if (!intact(value) || value.kind !== 'lso_immune_memory_lesson' || value.projectId !== ctx.projectId || value.projectRoot !== ctx.root) return {state: 'STALE', reasons: ['INVALID_OR_WRONG_SCOPE']};
  const adapter = ctx.adapter.read(ctx);
  const reasons = [];
  if (sha(strategy()) !== sha(value.strategy)) reasons.push('STRATEGY_CHANGED');
  if ((adapter.genome_sha256 || null) !== value.source.genomeSha256) reasons.push('GENOME_CHANGED');
  if ((adapter.status_sha256 || null) !== value.source.statusSha256) reasons.push('STATUS_CHANGED');
  if (!adapter.identity || adapter.identity.projectId !== value.projectId
    || adapter.identity.statusProjectId !== value.projectId
    || adapter.identity.protocol !== adapter.identity.statusProtocol
    || adapter.identity.protocol !== value.source.protocol.protocol
    || adapter.identity.statusProtocol !== value.source.protocol.statusProtocol) reasons.push('PROTOCOL_CHANGED');
  return {state: reasons.length ? 'STALE' : 'CURRENT', reasons};
}

module.exports = {lesson, reinforce, freshness};
