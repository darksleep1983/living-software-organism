# Architecture

Living Software Organism has a simple public model and a richer internal architecture.

## Public model

A project owns four things that matter to everyday users:

```text
Project identity
      |
Current state / continuity
      |
Fresh health checks
      |
Recovery evidence
```

The project remains the source of truth. AI models, providers and executors are replaceable clients of that state.

## Two implementation layers

```text
software project
      |
      v
Project Corpus
identity / current state / authority / continuity
      |
      | explicit adapter
      v
LSO Core
health / supervised intent / history / recovery evidence
      |
      v
Experimental contracts
cleanup planning / tracing / reconstruction evidence / supervision
```

### Project Corpus

Project Corpus is the durable, Markdown-first project-owned substrate. It is independently usable and does not require LSO or its Node.js package.

The optional Python Runtime remains optional.

### LSO Core

LSO consumes normalized project evidence through an explicit adapter and derives bounded, non-authoritative views. The bundled Project Corpus adapter is the default integration, not a source of semantic authority.

LSO never owns PROJECT, STATUS, policy, Tasks, Reports, source code or Owner decisions.

## Everyday continuity versus durable work records

The smallest human-facing continuity is:

```text
AGENTS.md
.project-corpus/state/PROJECT.md
.project-corpus/state/STATUS.md
```

Policy/config files provide machine binding and safety. Tasks, Reports and history are available for durable work records.

LSO itself does not require a Task/Report for every small edit. A project may require them through its own local protocol. They are especially useful for substantial, delegated, risky, resumable or evidence-heavy work.

## Advanced architecture vocabulary

The biological terminology is an internal architecture vocabulary. It maps to ordinary engineering concepts:

| Architecture term | Engineering responsibility |
|---|---|
| Homeostasis | Fresh derived project health |
| Supervised Repair | Frozen repair intent plus independent verification |
| Capability Binding | Explicit eligibility and scope binding |
| Immune Memory | Verified reusable lesson evidence |
| Metabolism | Resource budgets and observations |
| Health History | Change-only longitudinal health observations |
| Recovery Readiness | Evidence about declared recovery inputs |
| Autophagy / Hygiene | Cleanup planning without deletion authority |
| Rebirth Capsule | Bounded reconstruction evidence |
| Nervous System Tracing | Causal evidence tracing |
| Supervision Tree | Declared dependency/parent-child readiness |
| Phenotype | Comparison of declared reproducible properties |

These names remain in stable APIs where already public. The CLI and first-contact documentation use plain language first.

## Supported modes

1. **Project Corpus only**: durable project identity and continuity, no organism runtime required.
2. **LSO with another adapter**: health/recovery contracts over another explicit project-owned substrate.
3. **Project Corpus + LSO**: the bundled complete stack.

## Version boundaries

- Public package: `living-software-organism@0.1.0-rc.3`
- Accepted LSO architecture: v0.1-v0.7
- Experimental Organ Systems: unversioned
- Project Corpus: Protocol 2.0
- Optional Project Corpus Runtime: 2.2.0

Package version, architecture version and Project Corpus protocol/runtime versions are separate dimensions.

## Authority and safety boundary

Derived health, readiness, recovery, history, traces, capsules and property comparisons are evidence. They cannot authorize repair execution, shell execution, restore/overwrite, deletion, provider switching, billing, publication or canonical-state mutation.

LSO intentionally separates evidence from authority.
