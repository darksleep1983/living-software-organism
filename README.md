# Living Software Organism

[Русская версия](README.ru.md)

**Keep a software project's identity, current state, health and recovery evidence with the project, not in one AI chat.**

LSO is a small continuity and diagnostics layer for projects that move between Codex, Claude, Gemini, OpenHands or other replaceable agents. It does not try to become your coding agent. It keeps the project's own state readable and gives agents the same starting point.

## Start in a few minutes

Requires Node.js 26+ and npm.

```sh
npm install living-software-organism@0.1.0-rc.3
npx lso init --dry-run
npx lso init --yes
npx lso doctor
```

That is enough to start. Review the dry-run before applying it.

`init` does not modify source code, install project dependencies, run your build, commit Git changes or publish anything.

## The simple model

For everyday use, think in four concepts:

| Concept | What it means |
|---|---|
| **Project identity** | What this project is, its rules and scope |
| **Current state** | What is true now and what work is active |
| **Health** | Whether the declared project state is coherent |
| **Recovery evidence** | What can be verified about reconstructing the declared project substrate |

The project keeps its own continuity. AI models and executors are replaceable.

### Minimal everyday continuity

The human-readable core is:

```text
AGENTS.md
.project-corpus/state/PROJECT.md
.project-corpus/state/STATUS.md
```

A small machine-readable policy file and `lso.config.json` bind the tooling safely.

You do **not** need to write a Task and Report for every tiny edit. Use durable Tasks/Reports when the project's own protocol requires them or when work is substantial, delegated, risky, resumable across sessions, or needs evidence that should outlive one chat.

## What the main commands do

```sh
npx lso doctor
npx lso status
npx lso context --json
npx lso recover plan
npx lso recover rehearse
```

- `doctor` checks project identity, continuity, health and recovery readiness without changing canonical files.
- `status` gives a compact current snapshot.
- `context --json` gives an agent bounded pointers and evidence. It does not replace reading project authority.
- `recover plan` describes what is known, missing or still unproven.
- `recover rehearse` verifies the declared substrate in isolation. It never authorizes a live restore.

## Advanced architecture vocabulary

The biological names are architecture vocabulary, not prerequisites for using LSO:

| Architecture term | Plain engineering meaning |
|---|---|
| Homeostasis | Derived project health |
| Immune Memory | Verified reusable lessons |
| Metabolism | Resource budgets and observations |
| Health History | Change-only health history |
| Recovery Readiness | Evidence about declared recovery inputs |
| Autophagy | Cleanup planning only |
| Rebirth Capsule | Bounded reconstruction evidence |
| Nervous System Tracing | Causal execution/evidence tracing |
| Phenotype | Comparison of declared reproducible properties |

Stable programmatic namespaces remain unchanged for compatibility. Experimental Organ Systems remain unversioned.

## What LSO deliberately does not do

No autonomous repair, arbitrary shell execution, background daemon, implicit network access, deletion, live restore/overwrite, provider switching, billing or publication. Evidence does not grant authority.

Only explicit `lso origin verify` contacts a declared Git origin. Successful source verification still does not prove full application reconstruction.

## Project Corpus relationship

This repository includes Project Corpus as an independently usable Markdown-first continuity substrate. You can use Project Corpus alone, LSO with another explicit adapter, or the combined stack.

Package version `0.1.0-rc.3` is lifecycle metadata. Accepted LSO architecture remains v0.1-v0.7. Project Corpus remains Protocol 2.0 with optional Python Runtime 2.2.0.

## From a source checkout

```sh
npm pack ./components/organism --pack-destination .
cd /path/to/your-project
npm install --no-save /absolute/path/to/living-software-organism-0.1.0-rc.3.tgz
npx lso init --dry-run
```

Repository checks:

```sh
npm test
npm run check
npm run demo
npm run pack:organism
```

## Documentation

- [Getting started](docs/getting-started.md) · [Начало работы](docs/getting-started.ru.md)
- [CLI and agent workflow](docs/productization.md) · [CLI и работа агентов](docs/productization.ru.md)
- [Architecture](docs/architecture.md)
- [Organism API](components/organism/docs/api.md)
- [Safety](components/organism/docs/safety.md) · [Recovery](components/organism/docs/recovery.md)

## Licensing

Living Software Organism uses the MIT License. The embedded Project Corpus component preserves its own MIT license and attribution. See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md).
