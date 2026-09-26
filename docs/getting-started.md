# Getting started

Living Software Organism is a public pre-release source repository. No unified npm/PyPI umbrella package is published yet.

## Start with your problem

Use the complete stack if any of these sound familiar:

- you switch between Codex, Claude, Gemini, OpenHands or other executors;
- a project lives longer than one chat/session;
- multiple agents can make claims about the same project;
- old summaries become stale;
- you need direct evidence for health or recovery claims;
- you want project identity and authority to survive model/provider changes.

The recommended path is **Project Corpus + LSO**.

## Recommended: Project Corpus + LSO

From the repository root:

    node examples/full-stack/smoke.js

For repository verification:

    node tools/check.js
    node tools/verify.js

The integration smoke exercises the real Project Corpus Protocol V2 file layout through the real LSO Project Corpus adapter.

A healthy smoke demonstrates the integration boundary. It does not authorize repair, restore, deletion or publication.

## Project Corpus only

Use components/project-corpus.

Its original Protocol, Runtime, templates, tests and documentation remain together. Protocol-only use requires no Python installation. The optional Runtime keeps the existing Python package identity project-corpus.

The former standalone GitHub repository is archived for historical/reference use, but the embedded component remains independently usable.

## Organism layer only

Use components/organism.

The component is a dependency-free CommonJS Node library. Its component commands remain:

    npm test
    npm run smoke
    npm run check

It can use projectCorpusAdapter() or another explicit adapter implementing the documented normalized evidence contract.

## Supported development baselines

- Project Corpus Runtime: Python 3.11+
- Organism reference implementation: Node.js 26+

## Current publication evidence

The public repository has already passed its publication gate with:

- GitHub CI across supported Project Corpus OS/Python combinations;
- Node 26 organism checks on Windows and Ubuntu;
- full-stack integration and docs checks;
- a true fresh clone from GitHub with committed-byte/history verification.

That evidence applies to the repository publication. It does not turn experimental Organ Systems into v0.8 or guarantee complete recovery of external services and undeclared dependencies.

See each component README for detailed guarantees and limits.
