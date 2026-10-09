# Worker Previews Starter (cf CLI variant)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/thomas-desmond/worker-previews-starter-cf)

> **Test variant.** Same app as [`worker-previews-starter`](https://github.com/thomas-desmond/worker-previews-starter), but configured with `cloudflare.config.ts` and run with the [`cf` CLI](https://developers.cloudflare.com/cf/) instead of `wrangler.json` and Wrangler. It exists to dry-run the workshop on cf and collect feedback. The Worker is `worker-previews-starter-cf` and the database is `activity-log-db-cf`, so it can live next to the Wrangler starter in the same account.

<!-- dash-content-start -->

The starter app for the Worker Previews workshop. It's a small Activity Log: a Worker with a D1 database and a UI for adding and deleting entries. The page shows a badge telling you whether you're on Production or a Preview.

In the workshop you give your branch its own Preview with a separate D1 database, test a new schema there without touching production, track down a bug the new schema causes (it's deliberate) using that Preview's Observability logs, and merge a fix.

<!-- dash-content-end -->

## Learn more

- [Worker Previews announcement](https://blog.cloudflare.com/worker-previews/)
- [Worker Previews docs](https://developers.cloudflare.com/workers/previews/)
- [D1 docs](https://developers.cloudflare.com/d1/)

## What's in the repo

| Path | Purpose |
| --- | --- |
| `src/` | The Worker and its HTML UI |
| `migrations/` | Production schema and seed data, applied after each production deploy (`postdeploy`) |
| `preview-migrations/` | The Preview database's schema, seed rows, and a candidate schema change. Applied only with `cf d1 migrations apply <preview-db-id> --dir preview-migrations`, so it never reaches production. |
| `cloudflare.config.ts` | Worker config. The `ctx.isPreview` branch is the Previews' config; the final `return` is production's. |
| `wrangler.config.ts` | Bundler-only settings (`uploadSourceMaps`) that `cf migrate` split out. No bindings live here. |
| `scripts/d1-migrate.mjs` | Applies D1 migrations by database *name*. `cf d1 migrations apply` only takes IDs, and production's ID doesn't exist until the first deploy creates the database. |
| `AGENTS.md` | Instructions for your coding agent: keep Preview settings in the `ctx.isPreview` branch, never write to production data, test on the Preview URL, read the Preview's logs. `CLAUDE.md` points Claude Code at it. |
| `.mcp.json`, `.cursor/`, `.vscode/`, `.codex/`, `opencode.json` | Connect Claude Code, Cursor, VS Code (Copilot), Codex, and OpenCode to the read-only [Workers Observability MCP server](https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/workers-observability). |

## Scripts

| Script | Runs |
| --- | --- |
| `npm run dev` | Applies `migrations/` locally, then `cf dev` |
| `npm run check` | `tsc && cf deploy --dry-run` |
| `npm run deploy` | `cf deploy`, then `postdeploy` applies `migrations/` to `activity-log-db-cf` |
| `npm run cf-typegen` | `cf workers types` |

## Getting started

Click **Deploy to Cloudflare** above. If the deploy form asks for commands, use:

- Build command: *(empty)*
- Deploy command: `npm run deploy`
- Preview command: `npx cf previews deploy`

## Manual setup (without the button)

1. Create your own copy: **Use this template** on GitHub (or `gh repo create <name> --template thomas-desmond/worker-previews-starter-cf --public --clone`).
2. Install and sign in:
   ```bash
   npm install
   npx cf auth login
   ```
3. Deploy. `cf deploy` creates `activity-log-db-cf` from the name-only binding, then `postdeploy` applies `migrations/`:
   ```bash
   npm run deploy
   ```
4. In the dashboard, open the Worker → **Settings** → **Builds** → connect your repo, with the commands above.
