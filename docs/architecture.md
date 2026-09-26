# Unified architecture

Living Software Organism is organized as one repository with two independent architectural layers.

    software project
          |
          v
    Project Corpus
    identity / continuity / authority / current state / evidence references
          |
          | explicit adapter
          v
    LSO Core
    health / repair contracts / capability binding / immune memory
    metabolism / health history / recovery readiness
          |
          v
    Experimental Organ Systems
    rebirth / readiness / tracing / hygiene / supervision / phenotype

## Project Corpus is the substrate

Project Corpus owns no organism behavior. It defines durable project-owned records and optional policy-enforced Runtime operations.

The Protocol remains Markdown-first and independently usable. The optional Python Runtime remains optional. Embedding Project Corpus in this monorepo does not make LSO a requirement for Protocol users.

## LSO is the organism layer

The organism component consumes normalized project evidence through an adapter. The bundled Project Corpus adapter is the recommended integration, not a semantic shortcut.

LSO never becomes authority over PROJECT, STATUS, policy, Tasks, Reports, or a consuming project's Owner gates.

## Three supported architectural modes

1. Project Corpus alone - durable identity and continuity without organism runtime.
2. LSO with another adapter - organism contracts over another explicit project-owned substrate.
3. Project Corpus + LSO - recommended complete stack.

## Version boundaries

Project Corpus keeps its own versioning:

- Protocol 2.0
- optional Runtime 2.2.0

LSO architecture keeps its own maturity boundary:

- accepted architecture v0.1-v0.7
- experimental Organ Systems remain unversioned

A monorepo commit or package version does not automatically promote an architecture contract.

## Authority boundary

Derived health, readiness, recovery, history, traces, capsules and phenotype are evidence. They cannot authorize repair execution, shell execution, restore/overwrite, deletion, provider switching, billing, publication, or canonical state mutation.
