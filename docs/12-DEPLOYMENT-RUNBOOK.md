# Deployment Runbook

## Environments
- Local development.
- Preview/staging for pull requests.
- Production.

## Branch strategy
- `main` is production-ready.
- Feature branches for changes.
- Pull request required for material features once repository workflow is established.

## Required PR checks
Typecheck, lint, tests, build, and representative E2E smoke tests.

## Release steps
1. Confirm PR scope and tests.
2. Confirm source facts are current if changed.
3. Confirm analytics event changes.
4. Confirm no ad/privacy regression.
5. Merge after required checks.
6. Deploy production.
7. Run production smoke check.
8. Monitor errors and key flows.

## Rollback triggers
Rollback or hotfix when:
- core tool outputs are wrong;
- widespread blank/error pages;
- accidental ad-click layout issue;
- privacy leak;
- broken canonical/indexing at scale;
- severe performance regression.

## Rollback principle
A known-good previous production deployment should be restorable without reconstructing it manually.

## Database note
MVP has no database migrations. If a database is introduced, add backup, migration, rollback, and data-retention procedures before launch.

## Known local environment limitation: `pnpm preview` on Windows
`pnpm preview` (`opennextjs-cloudflare build && ... preview`) fails on native Windows with
`EPERM: operation not permitted, symlink ...` while OpenNext stages the server bundle's
`node_modules`. This is a Windows non-elevated symlink restriction in the OpenNext/Wrangler
build tooling itself, not an application code defect — do not attempt to fix it by rewriting
app code. It is validated instead in an environment that allows symlinks: WSL2, native Linux,
macOS, or CI.

### Validating `pnpm preview` under WSL2
1. Install a distro if you don't have one: `wsl --install -d Ubuntu` (reboot if prompted), or
   confirm one exists with `wsl --status`.
2. Inside the WSL shell, install Node.js (matching `package.json`'s `engines.node: >=22.13.0`)
   and pnpm — for example via `nvm`:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   # restart the shell, then:
   nvm install 22
   corepack enable
   ```
3. From WSL, `cd` into the project through its Windows-drive mount (e.g.
   `cd /mnt/c/Users/<you>/OneDrive/Music/Documents/Projects/creatortoolworks`), or clone a
   copy into the native Linux filesystem (`~/creatortoolworks`) for better filesystem
   performance/fewer permission quirks.
4. `pnpm install`
5. `pnpm preview` — should complete without the symlink error and start a local Workers
   runtime preview.
6. Smoke-check the preview URL it prints (home, catalog, tool page, `/sitemap.xml`,
   `/robots.txt`).

### `compatibility_date` is pinned below today, not floating
`wrangler.jsonc`'s `compatibility_date` is intentionally set to the newest date the
**installed** `wrangler` devDependency's bundled `workerd` binary supports locally, not to
"today." A locally installed `workerd` binary rejects any `compatibility_date` newer than what
it was built to support — e.g. with `wrangler@4.120.0`, `pnpm preview` failed with `This Worker
requires compatibility date "2026-08-21", but the newest date supported by this server binary
is "2026-08-08"` when the date was bumped to the actual current date. This was only discoverable
once `pnpm preview` could run at all (i.e. once WSL validation was possible) — it's very likely
the date had been silently invalid for local preview since it was first set. To move
`compatibility_date` forward, bump the `wrangler` devDependency first, confirm `pnpm preview`
still starts under WSL2/Linux/CI, and only then advance the date.

### Validating under CI (GitHub Actions or similar)
Any Linux-based CI runner works without the symlink issue. Minimal steps in a job:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
- run: corepack enable
- run: pnpm install
- run: pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e
- run: pnpm preview   # or opennextjs-cloudflare build, for a build-only check
```
This project has not yet had CI configured; adding a workflow file is a reasonable next step
once this is validated manually at least once.

## Cloudflare authentication procedure
1. `pnpm exec wrangler login` — opens a browser to authorize Wrangler against your Cloudflare
   account (requires access to the Cloudflare account that owns/will own the
   `creatortoolworks.com` zone). Confirm with `pnpm exec wrangler whoami`.
2. For CI/non-interactive environments, use an API token instead: create one in the
   Cloudflare dashboard (My Profile → API Tokens → a token with Workers Scripts:Edit and
   Zone:Edit/DNS:Edit permissions scoped to the `creatortoolworks.com` zone), then set
   `CLOUDFLARE_API_TOKEN` (and `CLOUDFLARE_ACCOUNT_ID`) as environment variables/secrets —
   do not commit these values.

## Custom Domain configuration (creatortoolworks.com)
`wrangler.jsonc` now declares the Worker's production Custom Domain:
```jsonc
"routes": [
  { "pattern": "creatortoolworks.com", "custom_domain": true }
]
```
A Custom Domain (as opposed to a plain Route) is used deliberately because this Worker *is*
the site's origin — Cloudflare provisions the DNS record and TLS certificate for the domain
automatically on first deploy, rather than requiring the domain to already point somewhere
else that the Worker then intercepts. Prerequisite: the `creatortoolworks.com` zone must
already be active on the Cloudflare account used to authenticate (see above); this config
does not create that zone or any DNS record for it.

### www → apex redirect (documentation only, no DNS assumptions made)
The canonical hostname is `https://creatortoolworks.com` — **not** `www`. This repo does not
configure `www.creatortoolworks.com` as a Custom Domain or Route, and does not assume a DNS
record for `www` already exists. *If and when* `www.creatortoolworks.com` is added to the
zone (e.g. as a CNAME to the apex, proxied through Cloudflare), redirect it to the apex with a
zone-level Cloudflare Redirect Rule (Rules → Redirect Rules in the dashboard, or the
equivalent Terraform/API call) — not a Worker route:
- Condition: hostname equals `www.creatortoolworks.com`
- Action: Dynamic Redirect to `https://creatortoolworks.com${http.request.uri.path}`,
  308/301 status, preserving query string.

This keeps the redirect entirely at Cloudflare's edge, independent of the Worker/app code.

## First production deployment procedure
Only proceed once explicitly approved — do not run these against production otherwise.
1. Complete the Cloudflare authentication procedure above.
2. Confirm the `creatortoolworks.com` zone is active on that Cloudflare account (prerequisite
   for the Custom Domain to provision successfully).
3. Validate `pnpm preview` succeeds in WSL2/Linux/CI (see above) at least once before the
   first deploy. Done: validated under WSL2 on 2026-08-21 — build, local server start, and a
   smoke check of `/`, `/youtube-tools`, the tool page, `/sitemap.xml`, `/robots.txt`, `/about`,
   `/contact`, `/privacy`, and `/terms` (all 200) all passed. Re-validate if `wrangler`,
   `compatibility_date`, or routing config change again.
4. `pnpm build` — confirm it passes (already validated in this repo).
5. `pnpm deploy` (`opennextjs-cloudflare build && opennextjs-cloudflare deploy`) — this is the
   actual production deploy step; run it from an environment where step 3 already succeeded.
6. On first deploy, verify in the Cloudflare dashboard (Workers & Pages → this Worker →
   Settings → Domains & Routes) that the Custom Domain shows as active with a provisioned
   certificate.
7. Run a production smoke check: home page, `/youtube-tools`, the tool page, `/sitemap.xml`,
   `/robots.txt`, and the new `/about`, `/contact`, `/privacy`, `/terms` pages all resolve over
   HTTPS at `https://creatortoolworks.com`.
8. Confirm the draft tool page still serves `noindex` and is absent from the deployed
   `sitemap.xml` (it should stay that way until explicit release approval).
