# Living Software Organism

Living Software Organism (LSO) is a prerelease Node.js package for project-owned continuity, health checks and bounded recovery evidence across AI-assisted development sessions.

## Start here

Requires Node.js 26+.

```sh
npm install living-software-organism@0.1.0-rc.4
npx lso init --dry-run
npx lso init --yes
npx lso doctor
```

The package is publicly available as `living-software-organism@0.1.0-rc.4`.

For everyday use, you only need to understand four ideas:

- **Project identity**: what the project is and what rules apply.
- **Current state**: what is true now and what work is active.
- **Health**: whether project-owned declarations agree with fresh evidence.
- **Recovery evidence**: what is actually verified about the declared project substrate.

LSO does not become the owner of those facts. The consuming project remains authoritative.

## Minimal continuity

With the bundled Project Corpus V2 adapter, the primary human-readable files are:

```text
AGENTS.md
.project-corpus/state/PROJECT.md
.project-corpus/state/STATUS.md
```

A small policy file and `lso.config.json` bind the tooling.

Tasks/Reports are available for durable work records. LSO itself does not require one for every trivial edit; use them when the project's local protocol requires them or when work is substantial, delegated, risky, resumable or needs durable evidence.

## CLI

Useful first commands:

```sh
npx lso doctor
npx lso status
npx lso context --json
npx lso recover plan
npx lso recover rehearse
```

The CLI is read-only by default. `init` creates only the explicitly shown bootstrap paths after confirmation. Recovery rehearsal writes isolated evidence under the configured runtime and never authorizes live restore.

## Programmatic API

The stable public namespaces remain:

- `homeostasis`
- `repair`
- `capabilities`
- `immune`
- `metabolism`
- `history`
- `recovery`
- `experimental`

Those names are architecture vocabulary, not onboarding requirements.

Plain-language mapping:

| Namespace / term | Meaning |
|---|---|
| `homeostasis` | Project health |
| `repair` | Supervised repair intent and verification |
| `capabilities` | Explicit capability eligibility and binding |
| `immune` | Verified reusable lessons |
| `metabolism` | Resource budgets and observations |
| `history` | Change-only health history |
| `recovery` | Recovery readiness and isolated rehearsal |
| experimental hygiene/autophagy | Cleanup planning |
| capsule | Bounded reconstruction evidence |
| trace | Causal evidence tracing |
| phenotype | Declared property comparison |

See [the API guide](docs/api.md) for exact signatures.

## Architecture and maturity

The software project is the durable system. Models, providers and executors are replaceable.

Accepted architecture remains v0.1-v0.7. Experimental Organ Systems remain unversioned and include recovery dependency declarations, reconstruction evidence, readiness, tracing, hygiene, supervision and reproducible-property comparison.

This is still a prerelease product. Do not infer broad compatibility, whole-application recovery, fresh-machine reconstruction or bitwise reproducibility from local checks.

## Project Corpus relationship

Project Corpus is an optional, independently usable Markdown-first identity/continuity substrate. LSO consumes it through a small reference adapter. Another explicit adapter can provide equivalent normalized project evidence.

The core does not require a database, an AI provider or the optional Project Corpus Python Runtime.

## Development

```sh
npm test
npm run smoke
npm run check
```

Generated evidence belongs under the configured project-local runtime directory, default `.lso-runtime`.

## What LSO does not do

LSO does not autonomously repair or dispatch work. It does not execute arbitrary shell commands, poll in the background, start a daemon, delete project files, back up or restore live state, overwrite canonical files, switch providers, purchase services or publish externally.

Recovery readiness is evidence, not permission.

Further reading: [architecture](docs/architecture.md), [safety](docs/safety.md), [Project Corpus integration](docs/project-corpus.md), [recovery](docs/recovery.md), [experimental systems](docs/experimental.md), and [API](docs/api.md).

LSO is licensed under the MIT License. See [LICENSE](LICENSE).
