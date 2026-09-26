# Architecture

Living Software Organism (LSO) is a small, local Node.js library of project-level contracts. A project supplies its own identity, current state, policy, and fresh evidence through an adapter. LSO derives bounded views and receipts from those inputs; the consuming project remains the semantic authority.

```text
project-owned identity, policy, state, and evidence
                         |
                         v
                   adapter.read(ctx)
                         |
                         v
             LSO context and deterministic modules
      homeostasis · repair · capabilities · immune
           metabolism · history · recovery
                         |
                         +---- experimental systems
```

## Runtime and context

The current development baseline is Node.js 26 or newer, CommonJS, and no third-party runtime dependencies. LSO has no server, daemon, network requirement, database, or generic subprocess facility. A caller explicitly creates a context from an absolute root, a project identifier, a project-relative runtime path (default `.lso-runtime`), and an adapter implementing `read(ctx)`. The Project Corpus adapter is one reference implementation; the core contract does not require it.

The API is organized by responsibility: `homeostasis`, `repair`, `capabilities`, `immune`, `metabolism`, `history`, `recovery`, and `experimental`. Repair and capability namespaces describe or validate contracts only; they contain no execution or dispatch API. `repair.verify(ctx, contract)` may issue an `ACCEPTED` or `REJECTED` evidence receipt from fresh derived Homeostasis; this is not supervisor approval and does not execute a repair. The reference adapter is created with `projectCorpusAdapter()` and supplied as the `adapter` field to `createContext(...)`. See [the API guide](api.md) for exact exports.

## Accepted contracts v0.1–v0.7

- **v0.1 Homeostasis:** derives `STABLE`, `DEGRADED`, or `UNHEALTHY` from supplied evidence. It is non-authoritative.
- **v0.2 Supervised Repair Contracts:** freezes bounded intent against exact scope and source fingerprints. Fresh verification determines acceptance.
- **v0.3 Supervised Capability Repair:** allows a capability only with explicit exact opt-in. Generic fallback never grants repair authority.
- **v0.4 Verified Evolution / Immune Memory:** retains candidate lessons only from accepted bounded work; it never promotes lessons into canonical project state.
- **v0.5 Metabolism:** compares observations with explicit budgets. A missing budget is `UNCONFIGURED`.
- **v0.6 Health History:** stores meaningful observed projection changes. Repeated findings do not establish cause or unobserved continuity.
- **v0.7 Recovery Readiness:** checks a bounded declared canonical substrate and isolated rehearsal evidence. `READY` does not mean the whole application/runtime is recoverable.

These are the accepted local reference contracts, not a claim of a stable product release.

## Experimental systems

Recovery Dependency Contract, Rebirth Capsule, Organ Readiness, Nervous System Tracing, Clean Organism / Autophagy, Supervision Tree, and Reproducible Phenotype remain experimental and unversioned. Their ownership and limits are described in [experimental systems](experimental.md). They do not promote the accepted architecture to v0.8. The Human System Map is orientation documentation, not an execution stage.

## Persistence and authority

Deterministic calculations consume explicit inputs. When a module writes evidence, the caller's configured runtime path is confined beneath the project root. Runtime receipts and history are operational evidence, not canonical identity or policy. The host project decides whether evidence is fresh and acceptable and retains all Owner gates.

Project Corpus is an optional integration substrate. Its adapter reads the Protocol V2 file layout directly and does not require the optional Python Runtime. Other adapters can provide equivalent input without changing organism semantics. See [Project Corpus integration](project-corpus.md).
