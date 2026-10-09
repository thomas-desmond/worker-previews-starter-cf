# Worker Previews Starter (cf CLI variant)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/thomas-desmond/worker-previews-starter-cf)

> **Test variant.** Same app as [`worker-previews-starter`](https://github.com/thomas-desmond/worker-previews-starter), configured with `wrangler.json` (so the Deploy button and Workers Builds work), but every account and resource command in the workshop uses the [`cf` CLI](https://developers.cloudflare.com/cf/) instead of Wrangler. It exists to dry-run the workshop with cf and collect feedback. The Worker is `worker-previews-starter-cf` and the database is `activity-log-db-cf`, so it can live next to the Wrangler starter in the same account.

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
| `migrations/` | Production schema and seed data, applied on deploy (`predeploy`) |
| `preview-migrations/` | The Preview database's schema, seed rows, and a candidate schema change. Applied only with `cf d1 migrations apply <preview-db-id> --dir preview-migrations`, so it never reaches production. |
| `wrangler.json` | Production settings at the top level; Preview settings in the `previews` block |
| `AGENTS.md` | Instructions for your coding agent: keep Preview settings in `previews`, use cf for resource commands, never write to production data, test on the Preview URL, read the Preview's logs. `CLAUDE.md` points Claude Code at it. |
| `.mcp.json`, `.cursor/`, `.vscode/`, `.codex/`, `opencode.json` | Connect Claude Code, Cursor, VS Code (Copilot), Codex, and OpenCode to the read-only [Workers Observability MCP server](https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/workers-observability). |

## Which tool does what

| Wrangler (project, reads `wrangler.json`) | cf (account and resources) |
| --- | --- |
| Deploy button, Workers Builds, `npm run deploy`, `npm run dev`, `npm run check` | `cf auth login` / `whoami`, `cf d1 create` / `list` / `delete`, `cf d1 migrations apply <id> --dir preview-migrations`, `cf workers delete` |

Why not `cloudflare.config.ts`: the Deploy to Cloudflare button only reads a Wrangler configuration file, so a cf-only project can't be deployed with it yet.

## Getting started

Requires Node 22 or newer.

Click **Deploy to Cloudflare** above. It creates a copy of this repo in your GitHub account, provisions a production D1 database, connects Workers Builds, and deploys. Keep the default names in the deploy form so the workshop steps match.

## Manual setup (without the button)

1. Install dependencies and sign in. cf and Wrangler keep separate logins, and the deploy below uses Wrangler:
   ```bash
   npm install
   npx cf auth login
   npx wrangler login
   ```
2. Create a D1 database and put its ID in the `database_id` field of `wrangler.json`:
   ```bash
   npx cf d1 create --name activity-log-db-cf
   ```
3. Deploy. The `predeploy` script applies `migrations/` to the production database first:
   ```bash
   npm run deploy
   ```
