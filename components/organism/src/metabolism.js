'use strict';

const {demand} = require('./shared');

const METRICS = new Set(['resource.tokens', 'resource.api_calls', 'resource.gpu_seconds', 'resource.cpu_seconds',
  'resource.latency_ms', 'resource.storage_bytes', 'resource.cost_microunits']);
const UNITS = {'resource.tokens': 'tokens', 'resource.api_calls': 'calls', 'resource.gpu_seconds': 'seconds',
  'resource.cpu_seconds': 'seconds', 'resource.latency_ms': 'ms', 'resource.storage_bytes': 'bytes',
  'resource.cost_microunits': 'microunits'};
const AGGREGATIONS = new Set(['sum', 'avg', 'latest', 'max']);
const METRIC_AGGREGATIONS = {'resource.tokens':['sum'], 'resource.api_calls':['sum'], 'resource.gpu_seconds':['sum'], 'resource.cpu_seconds':['sum'], 'resource.latency_ms':['avg','latest','max'], 'resource.storage_bytes':['latest','max'], 'resource.cost_microunits':['sum']};

function evaluate(ctx, policy, events, now) {
  demand(Number.isFinite(now), 'METABOLISM_EXPLICIT_NOW_REQUIRED');
  demand(policy && Array.isArray(policy.budgets), 'METABOLISM_POLICY_INVALID');
  demand(Array.isArray(events), 'METABOLISM_EVENTS_INVALID');
  demand(new Set(policy.budgets.map(b => b && b.id)).size === policy.budgets.length, 'DUPLICATE_BUDGET_ID');
  const budgets = policy.budgets.map((budget, index) => {
    demand(budget && typeof budget.id === 'string' && METRICS.has(budget.metric), 'METABOLISM_BUDGET_INVALID');
    demand(AGGREGATIONS.has(budget.aggregation) && METRIC_AGGREGATIONS[budget.metric].includes(budget.aggregation), 'METABOLISM_AGGREGATION_NOT_ALLOWED');
    demand(budget.unit === undefined || budget.unit === UNITS[budget.metric], 'METABOLISM_UNIT_INVALID');
    demand(Number.isFinite(budget.windowSeconds) && budget.windowSeconds > 0
      && Number.isFinite(budget.warnAt) && Number.isFinite(budget.limitAt)
      && budget.warnAt >= 0 && budget.limitAt > budget.warnAt, 'METABOLISM_INVALID_THRESHOLDS');
    demand(['advisory', 'owner_policy'].includes(budget.mode), 'METABOLISM_MODE_INVALID');
    const dimensions = budget.dimensions || {};
    demand(dimensions && typeof dimensions === 'object' && !Array.isArray(dimensions), 'METABOLISM_DIMENSIONS_INVALID');
    demand(Object.entries(dimensions).every(([k,v]) => /^[A-Za-z0-9_.-]+$/.test(k) && ['string','number','boolean'].includes(typeof v) && (typeof v !== 'number' || Number.isFinite(v))), 'METABOLISM_DIMENSIONS_INVALID');
    const start = now - budget.windowSeconds * 1000;
    const matching = events.filter(event => event && event.projectId === ctx.projectId
      && event.name === budget.metric && typeof event.timestamp === 'string'
      && Date.parse(event.timestamp) >= start && Date.parse(event.timestamp) <= now
      && Object.entries(dimensions).every(([key, value]) => event.dimensions && event.dimensions[key] === value));
    const good = [], invalidReasons = [];
    for (const event of matching) {
      if (!Number.isFinite(event.value) || event.value < 0) invalidReasons.push('INVALID_NUMERIC_VALUE');
      else if ((event.unit || event.dimensions && event.dimensions.unit) !== (budget.unit || UNITS[budget.metric])) invalidReasons.push('UNIT_MISMATCH');
      else good.push({value: event.value, timestamp: event.timestamp});
    }
    good.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    let value = null;
    if (good.length) {
      const values = good.map(x => x.value);
      if (budget.aggregation === 'sum') value = values.reduce((a, b) => a + b, 0);
      else if (budget.aggregation === 'avg') value = values.reduce((a, b) => a + b, 0) / values.length;
      else if (budget.aggregation === 'max') value = Math.max(...values);
      else value = values[values.length - 1];
    }
    const state = value === null ? 'NO_DATA' : value >= budget.limitAt ? 'LIMIT' : value >= budget.warnAt ? 'PRESSURE' : 'NORMAL';
    return {budget_id: budget.id, metric: budget.metric, unit: UNITS[budget.metric],
      aggregation: budget.aggregation, mode: budget.mode, state,
      observed: {value, valid_samples: good.length, invalid_samples: invalidReasons.length, invalid_reasons: invalidReasons},
      requires_owner_decision: state === 'LIMIT' && budget.mode === 'owner_policy',
      thresholds: {warn_at: budget.warnAt, limit_at: budget.limitAt},
      enforcement: {automatic_throttle: false, automatic_purchase: false, automatic_provider_switch: false,
        automatic_job_cancel: false, automatic_retry: false}};
  });
  let state;
  if (!budgets.length) state = 'UNCONFIGURED';
  else if (budgets.some(x => x.state === 'LIMIT')) state = 'LIMIT';
  else if (budgets.some(x => x.state === 'PRESSURE')) state = 'PRESSURE';
  else if (budgets.every(x => x.state === 'NO_DATA')) state = 'INSUFFICIENT_DATA';
  else if (budgets.some(x => x.state === 'NO_DATA')) state = 'INSUFFICIENT_DATA';
  else state = 'NORMAL';
  return {schema: 1, kind: 'lso_metabolism_report', contractVersion: '0.5',
    projectId: ctx.projectId, assessedAt: new Date(now).toISOString(), authority: 'NON_AUTHORITATIVE_RESOURCE_HOMEOSTASIS',
    metabolism: {state, pressure_detected: state === 'PRESSURE' || state === 'LIMIT',
      requires_owner_decision: budgets.some(x => x.requires_owner_decision)},
    budgets, configured_budgets: budgets.length,
    guarantees: {semantic_authority: false, invented_live_budget: false, automatic_throttle: false,
      automatic_purchase: false, automatic_provider_switch: false, automatic_job_cancel: false,
      automatic_retry: false, external_billing_lookup: false}};
}

module.exports = {evaluate, METRICS, UNITS};
