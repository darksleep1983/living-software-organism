# Living Software Organism

Living Software Organism (LSO) is an experimental, pre-release reference implementation of project-level health, continuity, bounded recovery, and evidence-based evolution contracts.

## What it is and why it exists

A software project outlives any one AI session. Its identity, rules, and history should remain with the project while models, providers, and executors can change. LSO gives a project a small set of explicit contracts for checking whether its declared identity is coherent, recording health changes, and describing supervised repair or recovery evidence.

The central principle is: **the software project is the durable organism; AI models, providers, and executors are replaceable temporary organs.** LSO is intended to preserve project identity across sessions and tools, assess health from fresh evidence, and reason about bounded recovery without treating an AI system as the project's owner.

## What it contains

The stable reference architecture covers:

- Homeostasis: a derived `STABLE`, `DEGRADED`, or `UNHEALTHY` view.
- Supervised repair contracts and explicit capability binding. Contracts describe bounded intent; they do not run it.
- Immune Memory: candidate lessons derived only from accepted evidence.
- Metabolism: explicit resource budgets and observations.
- Health History: change-only records of observed health projections.
- Recovery Readiness: bounded evidence about declared canonical inputs.

The Node.js library exposes responsibility namespaces for `homeostasis`, `repair`, `capabilities`, `immune`, `metabolism`, `history`, `recovery`, and `experimental`. A context uses an explicit absolute project root, project ID, optional relative runtime directory, and adapter. For a Project Corpus Protocol V2 layout, construct the adapter with `projectCorpusAdapter()` and pass it to `createContext({ root, projectId, runtime: '.lso-runtime', adapter })`. An alternate adapter can provide `read(ctx)` without requiring Project Corpus or its optional Python Runtime. See [the API guide](docs/api.md) for exports and examples.

## Maturity

The accepted reference architecture is v0.1 through v0.7: Homeostasis; Supervised Repair Contracts; Supervised Capability Repair; Verified Evolution / Immune Memory; Metabolism; Longitudinal Homeostasis / Health History; and Resilience / Recovery Readiness.

Organ Systems remain **experimental and unversioned**. This includes Recovery Dependency Contract, Rebirth Capsule, Organ Readiness, Nervous System Tracing, Clean Organism / Autophagy, Supervision Tree, and Reproducible Phenotype. The Human System Map is documentation, not a runtime stage. Extraction does not promote the architecture to v0.8.

This repository is an experimental public extraction, not a stable production release. Do not infer broad compatibility, full application recovery, fresh-machine reconstruction, or bitwise reproducibility from local checks.

Publication is blocked by `LICENSE_DECISION_REQUIRED_BEFORE_PUBLICATION`. No license has been selected; package metadata is `UNLICENSED` and private. No remote repository or published package is created by this extraction.

## Project Corpus relationship

Project Corpus is one optional durable identity and continuity substrate. LSO can consume it through a small reference adapter, while an explicit alternate adapter can supply equivalent project data. The project remains the owner of its semantics and canonical state; LSO does not copy or replace the Project Corpus protocol. Core deterministic operations do not require a database, network access, a particular AI provider, or the optional Project Corpus Python Runtime.

## Try it locally

The development baseline is Node.js 26 or newer. The package is private development metadata and is not published.

```sh
npm test
npm run smoke
npm run check
```

The programmatic entry point accepts a context created from an explicit project root and adapter. See [docs/api.md](docs/api.md) for exports and examples, [docs/architecture.md](docs/architecture.md) for module boundaries, and [docs/safety.md](docs/safety.md) for limits. Generated evidence belongs under the configured project-local runtime directory, which defaults to `.lso-runtime`.

## What LSO does not do

LSO does not autonomously heal or dispatch work. It does not execute repair contracts, run shell commands, poll in the background, start a server, delete project files, back up or restore live state, overwrite canonical files, switch providers, purchase services, or publish externally. A readiness result is not restore permission. A local hash or Git commit is not proof that every current byte can be reacquired elsewhere.

## Further reading

- [Architecture](docs/architecture.md)
- [Safety boundaries](docs/safety.md)
- [Project Corpus integration](docs/project-corpus.md)
- [Recovery and provenance](docs/recovery.md)
- [Experimental systems](docs/experimental.md)
- [Design origin](docs/design-origin.md)
- [API guide](docs/api.md)

The living-ship idea in *LEXX* was a conceptual spark and metaphor only. LSO is an original software architecture with no affiliation, adaptation, runtime dependency, or copied fictional IP implied. See [design origin](docs/design-origin.md).

No LSO license decision is recorded. A license must be explicitly decided before public publication; this repository does not include or imply one.
