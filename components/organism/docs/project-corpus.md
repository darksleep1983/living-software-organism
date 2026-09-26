# Project Corpus integration

Project Corpus and Living Software Organism solve related but distinct problems. Project Corpus provides a portable, project-owned identity, authority, and continuity substrate. LSO adds higher-level derived health and bounded evidence contracts. The project remains the owner of its meaning and canonical state.

## Reference adapter

The reference adapter is created with `projectCorpusAdapter()` and passed to `createContext({ root, projectId, runtime, adapter })`. It reads the Protocol V2 layout beneath the explicit project root, including the canonical project identity, current status, policy, and task/report/history references needed by supported modules. It does not hard-code an installation path and does not require the optional Project Corpus Python Runtime.

Adapters implement a small `read(ctx)` boundary. A different continuity system can provide the same concepts through its own adapter; health and organism contracts do not depend on Project Corpus filenames or authority rules. A consumer should supply only the data it is authorized to expose and the module actually needs.

## Ownership and dependency

Project Corpus is optional. LSO does not copy the Project Corpus protocol, become its semantic authority, or require it to become LSO. An integration adapter reads or resolves inputs; it does not override the host project's local authority. Core deterministic operations need no database, network connection, AI provider, or optional Python Runtime.

The local `.project-corpus/` directory used for this repository's own development continuity is ignored by product Git and is not a runtime dependency of the public package.
