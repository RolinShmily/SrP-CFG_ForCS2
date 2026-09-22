<div align="center">

[English](SECURITY.md) | [简体中文](SECURITY.zh-CN.md)

</div>

# Security Policy

## Supported Versions

Only the latest `v3.x` release line receives security fixes. Older tags, forks, and
users' own repackaged ZIPs are not supported.

| Version | Supported |
| :--- | :---: |
| Latest `v3.x` release | ✅ |
| Older releases | ❌ |

## Reporting a Vulnerability

**Please do not open a public issue for security problems.** Use one of:

1. **GitHub private reporting** — [Report a vulnerability](https://github.com/RolinShmily/SrP-CFG_ForCS2/security/advisories/new)
   (preferred: it keeps the report, the discussion, and the fix in one place).
2. **Email** — `rol1n@srprolin.top`.

Please include, as applicable: affected version, component (desktop suite / website /
config packages), reproduction steps, and any proof-of-concept or log output.

We aim to acknowledge within 3 business days. We will confirm the issue, agree on a
fix and disclosure timeline with you, and credit you in the release notes unless you
prefer otherwise.

## Scope

The desktop suite reads your machine and writes into your CS2 installation, so the
following are treated as security issues:

- **Path traversal or arbitrary file write** during ZIP extraction, package
  installation, snapshot restore, or update application — writing anywhere outside
  the detected CS2 directories, or overwriting `user/custom.cfg`.
- **Arbitrary code execution**, privilege escalation, or DLL/binary hijacking via the
  installer, updater, or a crafted input package.
- **Release integrity** — tampered release assets, bypassed signature/hash checks, or
  an update channel that can be redirected to an untrusted source.
- **Unsafe handling of local data** — reading or transmitting anything beyond the
  Steam / CS2 paths the app is meant to manage.
- **Website / AI assistant** — the Cloudflare Workers endpoint (prompt injection that
  leaks secrets, unauthorized KV/Vectorize access, SSRF, XSS).
- **Secrets in the repository** — any leaked token, key, or credential.

## Out of Scope

- Counter-Strike 2 or Steam engine behaviour, including the `VCFG` format itself —
  report those to [Valve](https://www.valvesoftware.com/en/security).
- Anything requiring a pre-existing compromised machine or physical access.
- The intended behaviour of applying configs: the app *is* supposed to modify files
  under your own CS2 directory, and it prints a pre-deployment diff for exactly that
  reason.
- Config packages authored by third parties. Only packages published by this project's
  release workflow are covered.
- Missing hardening without a demonstrated impact (e.g. absent CSP header, verbose
  log line, self-XSS).

## Handling of Your Data

The desktop suite works locally. Steam, CS2, and account paths are detected on your
machine and are not uploaded anywhere. Network access is limited to fetching release
metadata, downloading official packages, and (on the website) the AI assistant.
Packages are retrieved over HTTPS from GitHub Releases or the official mirror.

## Disclosure

We follow coordinated disclosure: we ask that you give us a reasonable window to ship
a fix before publishing details. Fixes land in the next `v3.x` release and are called
out in the release notes.

Thank you for helping keep SrP-CFG users safe.
