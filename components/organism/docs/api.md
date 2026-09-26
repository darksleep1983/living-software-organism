# Programmatic API

Use Node.js 26 or newer. There are no install-time or runtime third-party dependencies. All public namespaces are exported by `src/index.js` (the package main); there is no CLI, dispatcher, server or automatic worker.

```js
const path = require('node:path');
const lso = require('./src');
const ctx = lso.createContext({
  root: path.resolve('my-project'),
  projectId: 'my-project',
  runtime: '.lso-runtime',
  adapter: lso.projectCorpusAdapter()
});
const health = lso.homeostasis.inspect(ctx);
const manifest = lso.recovery.buildManifest(ctx);
```

The root must exist. Runtime paths are relative, project-confined and cannot overlap declared canonical sources or continuity. Adapters are trusted project integrations: they must return fresh, correctly scoped evidence. A context is not an OS sandbox. Concurrent hostile filesystem mutation is outside the threat model; use independent OS permissions for adversarial writers.

## Adapter boundary

`adapter.read(ctx)` returns:

- `identity`: `projectId`, `statusProjectId`, matching `protocol` and `statusProtocol`, `activeTaskId`, and an explicit `policyAgreement` boolean. The reference adapter also supplies `policyProjectId`, `policyVersion` and `lifecycle`.
- `sources`: bounded canonical records with `id`, project-relative `path`, `required`, `present`, `sha256` and `size`. The adapter declares the inventory; core never invents application dependencies.
- `continuity`: project-relative `{path, present}` directory records.
- `genome_sha256` and `status_sha256`: current SHA-256 fingerprints.

The optional Project Corpus adapter reads AGENTS, PROJECT, STATUS, portable policy, the exact active Task and continuity directories. Other adapters supply equivalent normalized evidence without Corpus files, a Python runtime or a database. [The smoke example](../examples/smoke.js) demonstrates a small alternate JSON/document substrate.

## Stable architectural responsibilities

| Namespace | Methods | Boundary |
|---|---|---|
| `homeostasis` | `inspect(ctx)` | Fresh derived health and proposal-only findings |
| `repair` | `freeze(ctx, findingId, gates)`, `assertFresh(ctx, contract)`, `verify(ctx, contract)` | Frozen exact scope, source fingerprints and fresh ACCEPTED/REJECTED evidence |
| `capabilities` | `eligibility(ctx, contract, declaration)`, `bind(ctx, contract, capabilityId, declaration, gates)`, `assertFresh(ctx, contract, binding, declaration)` | Exact opt-in, bounded metadata and freshness; no dispatch |
| `immune` | `lesson(ctx, candidate, chain)`, `freshness(ctx, lesson)`, `reinforce(ctx, lesson, candidate, chain)` | Verified candidate lessons and idempotent accepted evidence; no canonical promotion |
| `metabolism` | `evaluate(ctx, policy, events, nowMilliseconds)` | Explicit budgets and current observations; no resource enforcement |
| `history` | `capture(ctx, views)`, `trends(ctx)` | Explicit project-local change-only observations; no polling or causal diagnosis |
| `recovery` | `buildManifest(ctx)`, `rehearse(ctx)`, `verifyRehearsal(ctx, receiptRelativePath)` | Canonical substrate only; no restore |

`gates` is `{ownerConfirmed: true, localStartConfirmed: true}`. These are the caller's attestation of existing approvals, not approvals granted by LSO. The frozen repair contract is immutable. Call `assertFresh` before any separately authorized external work. After that work, `verify` freshly recomputes Homeostasis, requires the original finding to resolve and rejects new failures. Executor output is not supplied as acceptance input. Final supervisor approval remains separate.

A capability declaration binds `projectId` and `projectRoot` and contains `capabilities`. Each eligible capability declares a safe ID, `repair: {mode: 'supervised', findings: ['EXACT_FINDING'], acceptance: 'homeostasis'}`, Owner confirmation, allowed effect/enforcement/execution profile/risk. Generic fallback, wildcard opt-in, critical risk, external/VCS/admin effects and stale metadata are ineligible. Bindings are separate sealed evidence; the frozen parent contract is preserved.

An immune candidate contains `projectId`, `projectRoot`, a bounded `statement`, and the original contract `source`. Its chain contains `{repairContract, acceptance}`. The implementation re-verifies acceptance and binds the accepted current genome/protocol. Repeated evidence from the same contract cannot reinforce a lesson. Changing its bound inputs makes it stale. Seals are integrity hashes, not signatures or authority grants.

Metabolism policy shape is `{budgets: [{id, metric, aggregation, windowSeconds, warnAt, limitAt, mode, unit, dimensions}]}`. Observations have `{projectId, name, value, unit, timestamp, dimensions}`. Metric classes include tokens, API calls, GPU/CPU seconds, latency milliseconds, storage bytes and cost microunits. `nowMilliseconds` is explicit for repeatable windows. Missing budgets remain `UNCONFIGURED`; unavailable observations remain `NO_DATA` at budget level and `INSUFFICIENT_DATA` overall. Invalid matching data never becomes valid usage.

History consumes compact metabolism and immune views and freshly reads Homeostasis. It rejects cross-project inputs, excludes raw metric values, logs and conversations, and links meaningful projections. The current store retains at most 256 snapshots; it is a bounded operational view, not a durable audit ledger. Recurrence describes recorded snapshots only.

## Experimental declaration

`experimental` exports `validateContract`, `phenotype`, `capsule`, `verifyCapsule`, `readiness`, `supervision`, `hygiene`, `trace`, `verifyTrace` and `persist`. Operations take `(ctx, declaration, ...)`; `supervision` takes `(declaration, dependencyResults)`. The [declaration schema](../schemas/experimental.schema.json) documents shape; runtime validation additionally verifies binding, freshness, path classification and topology. It does not rely on a JSON Schema package.

Declarations bind `scope` equal to `project_id`, exact `physical_root`, `runtime`, substrate fingerprint, explicit source inventory, dependency/data classes, hashed recipe references, phenotype, organs, living roots and declared objects. `source.reacquisition` is strictly `UNPROVEN`. There is no positive durable-origin verifier, so `RECONSTRUCTIBLE` cannot currently be emitted.

Probes are only `file`, `sha256`, `json` top-level key checks, or `unavailable`. They never execute a recipe. Execution/import/service availability that these probes cannot establish must remain unverified.

`trace(ctx, declaration, events)` accepts at most 64 ordered parent-linked spans with scoped actor identifiers and hashed references. Unknown fields/raw payloads and sensitive reference names reject. Identifier/path filtering is not a content DLP guarantee. `persist` explicitly writes verified capsule/trace receipts under configured runtime. Hygiene is plan-only; no deletion function exists.

## Storage and errors

Explicit history capture, isolated rehearsal and experimental persistence write only under the configured project runtime. Pure diagnostic and contract methods do not mutate canonical state. Rehearsal returns a receipt path and `PASS`, `STALE_SOURCE` or `FAIL_TAMPERED`; every outcome preserves `restore_authorized=false`. Invalid inputs usually throw a stable error code; recovery verification reports tampering as a diagnostic result.

The public extraction intentionally changes private integration behavior: no built-in structural repair runner, Task-file creation, provider dispatch, central registry, root Doctor or private store. Responsibility contracts survive through explicit adapters and immutable evidence APIs. No existing project is automatically migrated.
