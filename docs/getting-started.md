# Getting started

The unified repository is currently a local/pre-release source distribution. No umbrella package is published yet.

## Recommended: Project Corpus + LSO

From the repository root:

    node examples/full-stack/smoke.js

For repository verification:

    node tools/check.js
    node tools/verify.js

The integration smoke exercises the real Project Corpus Protocol V2 file layout through the real LSO Project Corpus adapter.

## Project Corpus only

Use components/project-corpus.

Its original Protocol, Runtime, templates, tests and documentation remain together. Protocol-only use requires no Python installation. The optional Runtime keeps the existing Python package identity project-corpus.

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

See each component README for detailed guarantees and limits.
