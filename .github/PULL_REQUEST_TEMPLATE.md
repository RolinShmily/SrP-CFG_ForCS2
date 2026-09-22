<!--
English and 中文 are both welcome. Keep it concise.
For security fixes, do NOT open a PR with details — report privately first:
https://github.com/RolinShmily/SrP-CFG_ForCS2/security/advisories/new
-->

## Summary

<!-- What changes, and why. Link the issue this closes. -->

Closes #

## Type of Change

- [ ] `feat` — new capability
- [ ] `fix` — bug fix
- [ ] `refactor` / `perf` — no behavior change
- [ ] `docs` — documentation only
- [ ] `chore` / `ci` — tooling, build or release pipeline

## Scope

<!-- Which layers/components are touched? Delete the ones that do not apply. -->

- [ ] `config/srp-cfg/**` (Runtime Core, features, modes, presets)
- [ ] `config/annotations/**` or `config/video/**`
- [ ] `app/desktop/**`
- [ ] `app/website/**` or `app/shared/**`
- [ ] `.github/**` (CI, release, scripts)

## Verification

<!--
Paste the commands you ran and their result. At minimum, run the checks in
CONTRIBUTING.md that cover what you changed.
-->

```text
python3 .github/scripts/validate_cfg.py
node --test .github/scripts/sync_config_vectorize.test.mjs
node --experimental-strip-types --test app/website/src/lib/ai-stream.test.ts app/website/src/worker.test.ts
pnpm check:types
cargo test -p srp-cfg-core --manifest-path app/desktop/src-tauri/Cargo.toml

# app/desktop 改动时（Windows）：
cargo check --workspace --manifest-path app/desktop/src-tauri/Cargo.toml
cargo test -p srp-cfg-desktop --manifest-path app/desktop/src-tauri/Cargo.toml

# .github/workflows/ 改动时：
actionlint -color
```

## Screenshots

<!-- For UI changes: before / after. Delete this section otherwise. -->

## Checklist

- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and are scoped to one logical change each.
- [ ] `pnpm check:licenses` passes if dependencies changed (regenerate with `pnpm gen:licenses`).
- [ ] No generated artifacts are included (`.github/data/config-knowledge/*.json`, `public/data/commands.json`, synced fonts, `build/`, `dist/`, `target/`).
- [ ] No secrets, tokens or personal account paths are included.
- [ ] `config/` changes honor the four-layer boundary: no absolute `exec` paths, no writes to `user/custom.cfg`, comments use leading `//` and commands stay on one line.
- [ ] Docs updated when behavior changed, with the `README.md` / `README.zh-CN.md` pair kept in sync.
- [ ] I agree to follow the [Code of Conduct](https://github.com/RolinShmily/SrP-CFG_ForCS2/blob/main/CODE_OF_CONDUCT.md).
