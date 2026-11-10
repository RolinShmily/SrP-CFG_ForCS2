## Summary

<!-- What does this change do? Keep it to a few sentences. -->

## Why

<!-- The motivation: bug, use case, or design decision. Link the issue if one exists. -->

Fixes #

## Scope

- [ ] Core / CLI (`src/core`, `src/cli`)
- [ ] Desktop app (`src/gui`)
- [ ] Config packages (`config/**`)
- [ ] Website / Console (`website/**`)
- [ ] CI, packaging, or docs

## Verification

<!-- Paste the commands you actually ran. Remove unrelated output. -->

```bash
# Examples
cmake --preset core && cmake --build --preset core && ctest --preset core
pnpm --filter srp-cfg-website test
pnpm --filter srp-cfg-website lint
pnpm --filter srp-cfg-website build
```

- [ ] Core tests pass (if `src/core`, `src/cli`, `config/`, or `skills/` changed)
- [ ] Website tests, lint, and build pass (if `website/` changed)
- [ ] Console data tests and validation pass (if Console data/scripts changed)
- [ ] GUI built and smoke-checked with screenshots (if `src/gui` changed)
- [ ] `actionlint` passes (if `.github/workflows/**` changed)

## Checklist

- [ ] One logical change per PR; no unrelated formatting churn.
- [ ] No generated files (packages, `console-index.json`, licenses output) or local logs committed.
- [ ] Documentation updated where behavior, commands, routes, or schemas changed.
- [ ] No secrets, tokens, or personal paths added.
