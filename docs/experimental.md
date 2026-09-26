# Experimental organ systems

These systems are an unversioned candidate extension. Accepted LSO architecture remains v0.1–v0.7; this extraction does not promote a v0.8 contract. Each candidate describes evidence and state, not authority to execute actions.

- **Recovery Dependency Contract:** a project-owned declaration of source, runtime, build, platform, service, and durable-data dependencies, with required/optional distinctions and explicit unknowns.
- **Rebirth Capsule:** binds exact declared source bytes and bounded prerequisite/probe references. Local binding does not prove durable reacquisition. The current candidate cannot prove `RECONSTRUCTIBLE` from local hashes or a base commit alone.
- **Organ Readiness:** derives readiness separately from health. The `alive` flag and readiness state remain distinct; neither authorizes restart or repair.
- **Nervous System Tracing:** explicitly records a bounded causal chain using allowlisted actors and hashed references. It rejects raw payloads and unknown fields; it is not automatic telemetry or a content-sensitive-data scanner.
- **Clean Organism / Autophagy:** compares a declared inventory with explicit living roots and reference edges. Unknown and durable objects remain protected. The output is a cleanup plan; there is no delete API.
- **Supervision Tree:** validates declared parent/child and dependency relationships. Required failures propagate; optional failures degrade. Cycles and unknown nodes are rejected. It does not restart components or switch providers.
- **Reproducible Phenotype:** compares explicitly declared properties and reports `MATCH`, `PARTIAL`, `MISMATCH`, or `UNVERIFIED`. It does not promise universal or bitwise reproducibility.

Promotion requires separate review and additional evidence. The Human System Map is documentation/orientation only and is not a runtime stage.
