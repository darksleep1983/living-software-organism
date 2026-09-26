'use strict';

const repair = require('./repair');
const {demand, sha, seal, intact} = require('./shared');
const ALLOWED_EFFECTS = new Set(['project_write', 'project_runtime']);
const ALLOWED_ENFORCEMENT = new Set(['bounded_executor', 'owner_gate', 'os']);
const ALLOWED_PROFILES = new Set(['host', 'project_rw']);
const ALLOWED_RISK = new Set(['low', 'medium', 'high']);

function gateError(gates) {
  demand(gates && gates.ownerConfirmed === true, 'OWNER_CONFIRMATION_REQUIRED');
  demand(gates.localStartConfirmed === true, 'LOCAL_START_CONFIRMATION_REQUIRED');
}

function classify(capability, findingId) {
  const reasons = [];
  if (!capability || typeof capability !== 'object') return ['CAPABILITY_INVALID'];
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(capability.id || '')) reasons.push('CAPABILITY_ID_INVALID');
  const optIn = capability.repair && capability.repair.mode === 'supervised';
  if (!optIn) reasons.push('NO_REPAIR_OPT_IN');
  const findings = capability.repair && capability.repair.findings;
  if (!Array.isArray(findings) || !findings.length || findings.some(x => typeof x !== 'string' || x === '*' || !/^[A-Z][A-Z0-9_]{0,127}$/.test(x)) || !findings.includes(findingId)) reasons.push('FINDING_NOT_EXPLICITLY_ALLOWED');
  if (!ALLOWED_EFFECTS.has(capability.effect)) reasons.push('EFFECT_NOT_REPAIR_ALLOWLISTED');
  if (!ALLOWED_ENFORCEMENT.has(capability.enforcement)) reasons.push('ENFORCEMENT_NOT_BOUNDED');
  if (!ALLOWED_PROFILES.has(capability.executionProfile || capability.execution_profile)) reasons.push('EXECUTION_PROFILE_NOT_ALLOWED');
  if (!ALLOWED_RISK.has(capability.riskFloor || capability.risk_floor)) reasons.push((capability.riskFloor || capability.risk_floor) === 'critical' ? 'CRITICAL_RISK_NOT_ALLOWED' : 'RISK_FLOOR_REQUIRED');
  if (!((capability.ownerConfirmation === true) || (capability.owner_confirmation === true))) reasons.push('OWNER_CONFIRMATION_NOT_REQUIRED_BY_CAPABILITY');
  if (!capability.repair || capability.repair.acceptance !== 'homeostasis') reasons.push('HOMEOSTASIS_ACCEPTANCE_REQUIRED');
  return reasons;
}

function eligibility(ctx, contract, adapter) {
  repair.assertFresh(ctx, contract);
  const source = adapter || {};
  const capabilities = Array.isArray(source.capabilities) ? source.capabilities : [];
  const generic = source.genericFallback === true || source.generic_fallback === true;
  const adapterScopeOk = source.projectId === ctx.projectId && source.projectRoot === ctx.root;
  if (!adapterScopeOk && !generic) return seal({schema: 1, kind: 'lso_repair_capability_eligibility', projectId: ctx.projectId,
    findingId: contract.findingId, genericFallback: false, candidates: [], excluded: [], reason: 'ADAPTER_PROJECT_ID_MISMATCH',
    authority: 'NON_AUTHORITATIVE_CAPABILITY_VIEW', dispatchAvailable: false});
  if (generic) return seal({schema: 1, kind: 'lso_repair_capability_eligibility', projectId: ctx.projectId,
    findingId: contract.findingId, genericFallback: true, candidates: [], excluded: capabilities.map(c => ({id: c.id || null, reasons: ['GENERIC_FALLBACK_NOT_REPAIR_ELIGIBLE']})),
    authority: 'NON_AUTHORITATIVE_CAPABILITY_VIEW', dispatchAvailable: false});
  const candidates = [], excluded = [];
  const counts = new Map();
  for (const capability of capabilities) if (capability && typeof capability.id === 'string') counts.set(capability.id, (counts.get(capability.id) || 0) + 1);
  const seen = new Set();
  for (const capability of capabilities) {
    if (!capability || typeof capability.id !== 'string' || seen.has(capability.id) || counts.get(capability.id) > 1) {
      excluded.push({id: capability && capability.id || null, reasons: [capability && capability.id ? 'DUPLICATE_CAPABILITY_ID' : 'CAPABILITY_ID_INVALID']});
      if (capability && typeof capability.id === 'string') seen.add(capability.id);
      continue;
    }
    seen.add(capability.id);
    const reasons = classify(capability, contract.findingId);
    if (!reasons.length) candidates.push({id: capability.id, capabilitySha256: sha(capability), adapterSha256: sha(source)});
    else excluded.push({id: capability.id || null, reasons});
  }
  return seal({schema: 1, kind: 'lso_repair_capability_eligibility', projectId: ctx.projectId, projectRoot: ctx.root,
    findingId: contract.findingId, genericFallback: false, adapterSha256: sha(source), candidates, excluded,
    authority: 'NON_AUTHORITATIVE_CAPABILITY_VIEW', dispatchAvailable: false});
}

function bind(ctx, contract, capabilityId, adapter, gates = {}) {
  gateError(gates);
  const view = eligibility(ctx, contract, adapter);
  const candidate = view.candidates.find(x => x.id === capabilityId);
  demand(candidate && adapter.projectId === ctx.projectId && adapter.projectRoot === ctx.root, 'CAPABILITY_NOT_ELIGIBLE');
  return seal({schema: 1, kind: 'lso_repair_capability_binding', projectId: ctx.projectId, projectRoot: ctx.root,
    findingId: contract.findingId, contractSha256: contract.receipt_sha256,
    capabilityId, capabilitySha256: candidate.capabilitySha256, adapterSha256: candidate.adapterSha256,
    source: {genomeSha256: contract.source.genomeSha256, statusSha256: contract.source.statusSha256,
      sourceSha256: contract.source.sourceSha256},
    adapterProjectId: adapter.projectId, ownerConfirmed: true, localStartConfirmed: true, boundAt: new Date().toISOString(),
    executorResultIsAcceptance: false, dispatchAvailable: false, authority: 'NON_AUTHORITATIVE_CAPABILITY_BINDING'});
}

function assertFresh(ctx, contract, binding, adapter) {
  demand(intact(binding) && binding.kind === 'lso_repair_capability_binding', 'CAPABILITY_BINDING_INVALID');
  demand(binding.projectId === ctx.projectId && binding.projectRoot === ctx.root && binding.contractSha256 === contract.receipt_sha256, 'CAPABILITY_BINDING_SCOPE_MISMATCH');
  demand(adapter && adapter.projectId === ctx.projectId && adapter.projectRoot === ctx.root && binding.adapterProjectId === ctx.projectId, 'CAPABILITY_BINDING_SCOPE_MISMATCH');
  repair.assertFresh(ctx, contract);
  const view = eligibility(ctx, contract, adapter);
  demand(view.genericFallback === false && view.adapterSha256 === binding.adapterSha256, 'CAPABILITY_BINDING_STALE');
  const candidate = view.candidates.find(x => x.id === binding.capabilityId);
  demand(candidate && candidate.capabilitySha256 === binding.capabilitySha256, 'CAPABILITY_BINDING_STALE');
  return binding;
}

module.exports = {eligibility, bind, assertFresh};
