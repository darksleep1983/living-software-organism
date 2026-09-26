# Living Software Organism

[Русская версия](README.ru.md)

**Project-owned identity, memory, health, recovery and verified evolution for AI-assisted software.**

Living Software Organism (LSO) is a pre-release architecture and reference implementation for software projects that need to outlive any one AI session, model, provider, or executor.

The central idea is simple:

> **The software project is the durable organism. AI models, providers and executors are replaceable temporary organs.**

This repository is the complete stack:

    Living Software Organism
    ├── Project Corpus
    │   identity · continuity · authority · Tasks · Reports · context
    │
    └── Organism layer
        health · supervised repair · immune memory · metabolism
        history · recovery · readiness · tracing · hygiene
        supervision · phenotype

## Why two layers?

A project first needs to know what it is, what is authoritative, what is current, and what happened. That is Project Corpus.

Only then does it make sense to ask whether the project is healthy, what drifted, whether it can recover, what evidence is fresh, and what should survive. That is the organism layer.

They are integrated without collapsing their authority boundaries:

- **Project Corpus can be used by itself.**
- **The organism layer can use another explicit adapter.**
- **Project Corpus + LSO is the recommended complete stack.**

## Components

### Project Corpus

[components/project-corpus/](components/project-corpus/)

A vendor-neutral, Markdown-first protocol for durable project identity, continuity and authority, with an optional Python Runtime.

Current imported identity is preserved:

- Project Corpus Protocol 2.0
- optional Python Runtime 2.2.0
- Python package/import identity remains project-corpus / project_corpus
- Project Corpus remains independently usable
- its existing MIT license remains scoped to that component

### Living Software Organism

[components/organism/](components/organism/)

A Node.js reference implementation of bounded organism contracts.

Accepted architecture lineage:

- v0.1 Homeostasis
- v0.2 Supervised Repair Contracts
- v0.3 Supervised Capability Repair
- v0.4 Verified Evolution / Immune Memory
- v0.5 Metabolism / Resource Homeostasis
- v0.6 Longitudinal Homeostasis / Health History
- v0.7 Resilience / Recovery Readiness

The newer Organ Systems remain **experimental and unversioned**: Recovery Dependency Contract, Rebirth Capsule, Organ Readiness, Nervous System Tracing, Clean Organism / Autophagy, Supervision Tree, and Reproducible Phenotype.

This monorepo does not promote them to v0.8.

## Five-minute local tour

No unified package is published yet.

From the repository root:

    node examples/full-stack/smoke.js
    node tools/check.js
    node tools/verify.js

The full-stack smoke creates a temporary Project Corpus V2 project, loads it through the real LSO Project Corpus adapter, derives health and recovery evidence, confirms that restore authority remains false, and removes its temporary state.

See [Getting Started](docs/getting-started.md) for component-specific commands.

## What this system does not do

LSO does not grant itself authority over a project. It does not autonomously repair, dispatch work, execute generic shell commands, delete project files, restore live state, switch AI providers, buy services, or publish externally.

Derived health and recovery status are evidence, not authority. A hash proves covered bytes, not durable reacquisition. Local clean-clone evidence does not prove fresh-machine, cross-OS, or bitwise recovery.

## Maturity

This is a **pre-release unified monorepo**.

Project Corpus is the mature substrate component with its existing Protocol/Runtime releases. The organism layer remains a reference implementation with accepted architectural contracts through v0.7 and experimental unversioned extensions.

Remote CI for the unified repository has not yet run.

## Licensing

The imported Project Corpus component retains its existing MIT license at [components/project-corpus/LICENSE](components/project-corpus/LICENSE).

The umbrella repository and organism layer are licensed under the MIT License. The imported Project Corpus component remains MIT-licensed under its own preserved component license file.

See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md).

## Documentation

- [Getting Started](docs/getting-started.md)
- [Unified Architecture](docs/architecture.md)
- [Import provenance](docs/provenance.md)
- [Project Corpus component](components/project-corpus/README.md)
- [Organism component](components/organism/README.md)
- [Organism safety boundaries](components/organism/docs/safety.md)
- [Recovery and provenance](components/organism/docs/recovery.md)

The living-ship idea in LEXX was a conceptual spark and metaphor only. Living Software Organism is an original software architecture; no affiliation, adaptation, runtime dependency, or copied fictional IP is implied.
