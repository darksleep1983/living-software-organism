'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {createContext} = require('../src/context');
const {projectCorpusAdapter} = require('../src/corpus-adapter');
const homeostasis = require('../src/homeostasis');
const repair = require('../src/repair');
const capabilities = require('../src/capabilities');
const immune = require('../src/immune');
const metabolism = require('../src/metabolism');
const history = require('../src/history');
const {intact} = require('../src/shared');

function write(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, value, 'utf8');
}

function projectDoc(id, protocol = '2.0') {
  return `# Project\n\nProtocol-Version: ${protocol}\nProject-ID: ${id}\nLogical-Name: Fixture\n\n## Objective\n\nfixture\n\n## Invariants\n\nNONE\n\n## Durable Scope Boundaries\n\nfixture\n\n## Non-Goals\n\nNONE\n`;
}
function statusDoc(id, task = 'NONE', protocol = '2.0') {
  return `# Status\n\nProtocol-Version: ${protocol}\nProject-ID: ${id}\nLifecycle-Status: PAUSED\nActive-Task-ID: ${task}\nLast-Verified-At: UNVERIFIED\nEvidence-Class: UNVERIFIED\n\n## Current Verified Baseline\n\nUNVERIFIED\n\n## Blockers\n\nNONE\n\n## Evidence References\n\nNONE\n\n## Exact Next Action\n\nNONE\n`;
}
function corpus(root, id = 'fixture') {
  write(path.join(root, 'AGENTS.md'), `# ${id}\n`);
  write(path.join(root, '.project-corpus/state/PROJECT.md'), projectDoc(id));
  write(path.join(root, '.project-corpus/state/STATUS.md'), statusDoc(id));
  write(path.join(root, '.project-corpus/policy.toml'), `policy_version = "2.0"\nproject_id = "${id}"\n`);
  for (const name of ['tasks', 'reports', 'history']) fs.mkdirSync(path.join(root, '.project-corpus', name), {recursive: true});
}
function context(root, id = 'fixture') {
  return createContext({root, projectId: id, adapter: projectCorpusAdapter()});
}
function expectError(fn, code) {
  assert.throws(fn, error => error && error.message === code);
}

test('stable contracts assess, freeze, bind, learn, budget, and record bounded health evidence', t => {
  const fixtureBase = path.resolve(__dirname, '../.lso-runtime');
  fs.mkdirSync(fixtureBase, {recursive: true});
  const root = fs.mkdtempSync(path.join(fixtureBase, 'stable-test-'));
  t.after(() => {
    fs.rmSync(root, {recursive: true, force: true});
    assert.equal(fs.existsSync(root), false, 'fixture cleanup must leave no debt');
  });
  corpus(root);
  let ctx = context(root);

  assert.equal(homeostasis.inspect(ctx).state, 'STABLE');
  fs.rmSync(path.join(root, '.project-corpus/history'), {recursive: true});
  assert.equal(homeostasis.inspect(ctx).state, 'DEGRADED');
  write(path.join(root, '.project-corpus/state/STATUS.md'), statusDoc('other'));
  assert.equal(homeostasis.inspect(ctx).state, 'UNHEALTHY');
  assert.equal(homeostasis.inspect(ctx).authority, 'NON_AUTHORITATIVE_DERIVED_HEALTH');
  assert.equal(homeostasis.inspect(ctx).guarantees.automaticRepair, false);

  expectError(() => repair.freeze(ctx, 'IDENTITY_CONTINUITY', {ownerConfirmed: false, localStartConfirmed: true}), 'OWNER_CONFIRMATION_REQUIRED');
  expectError(() => repair.freeze(ctx, 'IDENTITY_CONTINUITY', {ownerConfirmed: true, localStartConfirmed: false}), 'LOCAL_START_CONFIRMATION_REQUIRED');
  const frozen = repair.freeze(ctx, 'IDENTITY_CONTINUITY', {ownerConfirmed: true, localStartConfirmed: true});
  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(intact(frozen), true);
  assert.equal(frozen.contractOnly, true);
  assert.equal(typeof repair.execute, 'undefined', 'stable API is contract-only and offers no execution method');
  const replayRoot = path.join(root, 'same-id-other-root');
  corpus(replayRoot);
  assert.equal(repair.verify(context(replayRoot), frozen).result, 'REJECTED', 'same project id cannot replay a contract across physical roots');
  const frozenStatus = fs.readFileSync(path.join(root, '.project-corpus/state/STATUS.md'), 'utf8');
  fs.appendFileSync(path.join(root, '.project-corpus/state/STATUS.md'), '\nchanged after freeze\n');
  expectError(() => repair.assertFresh(ctx, frozen), 'REPAIR_CONTRACT_STALE');
  write(path.join(root, '.project-corpus/state/STATUS.md'), frozenStatus);
  write(path.join(root, '.project-corpus/state/STATUS.md'), statusDoc('fixture'));
  const accepted = repair.verify(ctx, frozen);
  assert.equal(accepted.result, 'ACCEPTED');
  assert.equal(intact(accepted), true);
  assert.equal(accepted.executorClaimUsedAsAcceptance, false);
  assert.equal(repair.verify(ctx, {...frozen, receipt_sha256: 'forged'}).result, 'REJECTED');

  const capContract = repair.freeze(ctx, 'CONTINUITY', {ownerConfirmed: true, localStartConfirmed: true});
  const cap = {id: 'repair_continuity', repair: {mode: 'supervised', findings: ['CONTINUITY'], acceptance: 'homeostasis'},
    effect: 'project_write', ownerConfirmation: true, enforcement: 'owner_gate', executionProfile: 'project_rw', riskFloor: 'low'};
  const generic = capabilities.eligibility(ctx, capContract, {genericFallback: true, capabilities: [cap]});
  assert.deepEqual(generic.candidates, []);
  assert.equal(generic.genericFallback, true);
  const specific = {id: 'fixture-adapter', projectId: 'fixture', projectRoot: root, capabilities: [cap]};
  assert.equal(capabilities.eligibility(ctx, capContract, specific).candidates.length, 1);
  expectError(() => capabilities.bind(ctx, capContract, cap.id, specific, {ownerConfirmed: false, localStartConfirmed: true}), 'OWNER_CONFIRMATION_REQUIRED');
  expectError(() => capabilities.bind(ctx, capContract, cap.id, specific, {ownerConfirmed: true, localStartConfirmed: false}), 'LOCAL_START_CONFIRMATION_REQUIRED');
  const binding = capabilities.bind(ctx, capContract, cap.id, specific, {ownerConfirmed: true, localStartConfirmed: true});
  assert.equal(intact(binding), true);
  assert.equal(binding.dispatchAvailable, false);
  assert.equal(capabilities.assertFresh(ctx, capContract, binding, specific).capabilityId, cap.id);
  const critical = {id: 'fixture-adapter', projectId: 'fixture', projectRoot: root,
    capabilities: [{...cap, riskFloor: 'critical'}]};
  assert(capabilities.eligibility(ctx, capContract, critical).excluded[0].reasons.includes('CRITICAL_RISK_NOT_ALLOWED'));
  const duplicates = {id: 'fixture-adapter', projectId: 'fixture', projectRoot: root, capabilities: [cap, {...cap}]};
  assert.equal(capabilities.eligibility(ctx, capContract, duplicates).candidates.length, 0);
  const changed = {id: 'fixture-adapter', projectId: 'fixture', projectRoot: root, capabilities: [{...cap, instruction: 'changed'}]};
  expectError(() => capabilities.assertFresh(ctx, capContract, binding, changed), 'CAPABILITY_BINDING_STALE');

  const lessonCandidate = {projectId: 'fixture', projectRoot: root, statement: 'Keep identity fields aligned.', source: frozen.source};
  const lesson = immune.lesson(ctx, lessonCandidate, {repairContract: frozen, acceptance: accepted});
  assert.equal(lesson.freshness.state, 'CURRENT');
  assert.equal(lesson.promotion.automatic, false);
  assert.equal(intact(lesson), true);
  assert.equal(immune.reinforce(ctx, lesson, lessonCandidate, {repairContract: frozen, acceptance: repair.verify(ctx, frozen)}).evidenceCount, 1,
    'replaying the same accepted contract is idempotent');
  expectError(() => immune.lesson(ctx, lessonCandidate, {repairContract: frozen, acceptance: {result: 'ACCEPTED'}}), 'ACCEPTANCE_CHAIN_INVALID');
  write(path.join(root, '.project-corpus/state/STATUS.md'), statusDoc('other'));
  const secondContract = repair.freeze(ctx, 'IDENTITY_CONTINUITY', {ownerConfirmed: true, localStartConfirmed: true});
  write(path.join(root, '.project-corpus/state/STATUS.md'), statusDoc('fixture'));
  const secondAccepted = repair.verify(ctx, secondContract);
  const secondCandidate = {...lessonCandidate, source: secondContract.source};
  const repeatedLesson = immune.reinforce(ctx, lesson, secondCandidate, {repairContract: secondContract, acceptance: secondAccepted});
  assert.equal(repeatedLesson.evidenceCount, 2);
  assert.equal(repeatedLesson.reinforcement, 'REPEATED');
  write(path.join(root, '.project-corpus/state/PROJECT.md'), projectDoc('fixture') + '\nchanged genome\n');
  assert.equal(immune.freshness(ctx, lesson).state, 'STALE');

  const now = Date.parse('2026-09-26T12:00:00Z');
  const policy = {budgets: [{id: 'tokens_hour', metric: 'resource.tokens', aggregation: 'sum', windowSeconds: 3600,
    warnAt: 100, limitAt: 200, mode: 'advisory', unit: 'tokens'}]};
  assert.equal(metabolism.evaluate(ctx, {budgets: []}, [], now).metabolism.state, 'UNCONFIGURED');
  assert.equal(metabolism.evaluate(ctx, policy, [], now).budgets[0].state, 'NO_DATA');
  const event = (value, projectId = 'fixture') => ({projectId, name: 'resource.tokens', value, unit: 'tokens', timestamp: new Date(now - 60000).toISOString()});
  assert.equal(metabolism.evaluate(ctx, policy, [event(60), event(50, 'elsewhere')], now).metabolism.state, 'NORMAL');
  assert.equal(metabolism.evaluate(ctx, policy, [event(110)], now).metabolism.state, 'PRESSURE');
  assert.equal(metabolism.evaluate(ctx, policy, [event(210)], now).metabolism.state, 'LIMIT');
  assert.equal(metabolism.evaluate(ctx, policy, [{...event(90), unit: undefined}], now).budgets[0].state, 'NO_DATA');
  const scoped = {...policy, budgets: [{...policy.budgets[0], dimensions: {model: 'named'}}]};
  const wrongDimension = {...event(250), dimensions: {model: 'other'}};
  assert.equal(metabolism.evaluate(ctx, scoped, [wrongDimension], now).budgets[0].state, 'NO_DATA');
  assert.equal(metabolism.evaluate(ctx, {budgets: [...policy.budgets, {...policy.budgets[0], id: 'empty', metric: 'resource.api_calls', unit: 'calls'}]}, [event(10)], now).metabolism.state, 'INSUFFICIENT_DATA');
  assert.equal(metabolism.evaluate(ctx, policy, [{...event(NaN), value: 'bad'}], now).budgets[0].state, 'NO_DATA');
  expectError(() => metabolism.evaluate(ctx, policy, [], undefined), 'METABOLISM_EXPLICIT_NOW_REQUIRED');

  const hStable = homeostasis.inspect(ctx);
  const normal = metabolism.evaluate(ctx, policy, [event(10)], now);
  const capture1 = history.capture(ctx, {homeostasis: hStable, metabolism: normal});
  assert.equal(capture1.result, 'WRITTEN');
  const duplicate = history.capture(ctx, {homeostasis: hStable, metabolism: normal});
  assert.equal(duplicate.result, 'SKIPPED_UNCHANGED');
  const pressure = metabolism.evaluate(ctx, policy, [event(120)], now);
  assert.equal(history.capture(ctx, {homeostasis: hStable, metabolism: pressure}).result, 'WRITTEN');
  const trends = history.trends(ctx);
  assert.equal(trends.historyState, 'LONGITUDINAL');
  assert.equal(trends.pressureSnapshots, 1);
  assert.equal(trends.guarantees.causalDiagnosis, false);
  const raw = fs.readFileSync(path.join(root, '.lso-runtime/health-history/fixture.jsonl'), 'utf8');
  assert.equal(raw.includes('changed genome'), false);
  assert.equal(raw.includes('timestamp'), false, 'history stores states and fingerprints, not event records');
  assert.equal(raw.includes('"value"'), false, 'history omits raw metric values');
  assert(trends.recurringFindings.some(x => x.id === 'CONTINUITY' && x.snapshotCount === 2));
  assert.equal(trends.guarantees.unobservedContinuity, false);
  write(path.join(root, '.project-corpus/state/PROJECT.md'), projectDoc('fixture') + '\nnew genome\n');
  assert.equal(history.capture(ctx, {metabolism: pressure}).result, 'WRITTEN', 'genome changes are meaningful');
  expectError(() => history.capture(ctx, {metabolism: {...pressure, projectId: 'other'}}), 'HISTORY_VIEW_SCOPE_MISMATCH');
  const unavailableAdapter = {read() { throw new Error('EVIDENCE_UNAVAILABLE'); }};
  assert.equal(repair.verify({...ctx, adapter: unavailableAdapter}, frozen).result, 'REJECTED');
  expectError(() => metabolism.evaluate(ctx, {budgets: [{...policy.budgets[0], aggregation: 'avg'}]}, [], now), 'METABOLISM_AGGREGATION_NOT_ALLOWED');
});
