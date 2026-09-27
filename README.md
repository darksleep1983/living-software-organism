# Living Software Organism

[Русская версия](README.ru.md)

**Keep a software project’s identity, current state and recovery evidence with the project—not in one AI chat.** LSO is for developers handing work between Codex, Claude, Gemini, OpenHands or other replaceable agents.

## Try the local release candidate in five minutes

Requires Node.js 26+ and npm. The product package is a local candidate; it has not been published to npm.

Build it from this repository, then install the tarball into the project you want to adopt (use absolute path on Windows):

```sh
npm pack ./components/organism --pack-destination ./dist
cd /path/to/your-project
npm install --no-save /absolute/path/to/living-software-organism-0.1.0-rc.1.tgz
npx lso init --dry-run
npx lso init --yes
npx lso doctor
npx lso status
npx lso context --json
npx lso recover plan
npx lso recover rehearse
```

`init --dry-run` shows the exact plan; `--yes` approves only those deterministic paths. No source/dependencies are changed, no commands executed, no Git commits made. Review and commit yourself. Project Corpus can still be used alone.

From the repository root, run `npm test`, `npm run check`, `npm run demo`, and `npm run pack:organism`.

## What LSO is

The software project is the durable organism. Models, providers and executors are replaceable temporary organs. Project Corpus preserves project-owned identity, continuity and authority; the organism layer derives bounded health and recovery evidence without becoming authority.

Package version `0.1.0-rc.1` is lifecycle metadata, not architecture version. Accepted architecture remains v0.1–v0.7; experimental Organ Systems remain unversioned—not v0.8. Project Corpus remains Protocol 2.0 with optional Python Runtime 2.2.0.

## What LSO will not modify automatically

No autonomous repair, arbitrary shell execution, background service/polling, implicit network, deletion, live restore/overwrite, provider switching, billing, or publication. Doctor/recovery receipts are evidence only. Only explicit `lso origin verify` contacts a declared Git origin. Source reacquisition does not prove full application reconstruction and never grants restore authority.

## Architecture and components

This repository combines Project Corpus, an independently usable Markdown-first substrate, with the Living Software Organism's bounded health, recovery, history, and experimental evidence contracts. The component identity and optional Python Runtime remain separate. See [the architecture](docs/architecture.md), [Project Corpus](components/project-corpus/), and [Organism](components/organism/).

## Documentation

- [Getting started](docs/getting-started.md) · [Начало работы](docs/getting-started.ru.md)
- [Product CLI and agent workflow](docs/productization.md) · [Руководство CLI](docs/productization.ru.md)
- [Unified architecture](docs/architecture.md)
- [Organism API](components/organism/docs/api.md) · [Safety](components/organism/docs/safety.md) · [Recovery](components/organism/docs/recovery.md)

## Licensing

The umbrella and organism package use MIT; Project Corpus preserves its existing component license. See [LICENSE](LICENSE) and [LICENSING.md](LICENSING.md).

The LEXX living-ship idea was a conceptual spark only. LSO is an original architecture; no affiliation, adaptation or copied fictional IP is implied.