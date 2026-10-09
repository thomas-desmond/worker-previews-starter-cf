# Agent instructions

This repo is a Cloudflare Worker with a D1 database. It's configured with `cloudflare.config.ts` and managed with the `cf` CLI (`npx cf …`, pinned in `package.json`). There's no `wrangler.json`: don't create one, and don't run `wrangler` commands. `wrangler` is only installed as cf's bundler. To find a cf command, run `npx cf cli search "<what you want to do>"`. Every branch you push gets its own [Worker Preview](https://developers.cloudflare.com/workers/previews/): an isolated copy of the Worker with its own URL, bindings, and logs. Workers Builds posts the Preview URL on the branch's pull request. Use the Preview to check your own work before a human reviews it.

## Rules

- **`cloudflare.config.ts` returns one config for production and one for Previews.** The `if (ctx.isPreview)` branch is the Previews' config; the final `return` is production's. Previews don't inherit production vars or bindings. When a Preview needs a binding, add it to the `ctx.isPreview` branch's `env`. Never point a binding in that branch at a production resource.
- **Never write to production data.** Don't run `cf d1 query`, `cf d1 migrations apply`, or any other write against a production database. Production is the `DB` binding in the production `return` of `cloudflare.config.ts` (`activity-log-db-cf` by default). cf D1 commands take a database ID, so check with `npx cf d1 list` which database an ID belongs to before you write to it.
- **Previews and production never share a schema path.** `migrations/` is production's, applied automatically on deploy. `preview-migrations/` is the Preview database's, applied only with `--dir preview-migrations` against the Preview database's ID. Never copy a file from one folder to the other.
- **Don't edit a database schema to make a bug go away.** Fix the code. It has to work with production's schema and the Preview's.
- **Never merge a pull request, deploy to production, or run `cf deploy` (or `npm run deploy`) unless a human explicitly tells you to.** Pushing to a PR branch is fine: it only updates that branch's Preview. `npm run check` runs `cf deploy --dry-run`, which doesn't deploy anything, so it's fine.

## Finding the Preview URL

Workers Builds builds every push to a PR branch and comments on the PR with the **Preview URL** (one per branch, always the latest push) and a **deployment URL** for each commit.

1. Wait for the build: `gh pr checks --watch` (the check is named `Workers Builds: <worker-name>`).
2. Read the bot comment: `gh pr view --comments`. The Preview URL looks like `https://<branch>-<worker-name>.<subdomain>.workers.dev`.
3. The comment's deployment table lists the commit for each deployment. If your latest commit isn't in it yet, the Preview is still serving the old code.

## Changing the Preview database's schema

The Preview D1 database is shared by every Preview of this Worker. Its migrations live in `preview-migrations/`. `cf d1 migrations apply` takes the database ID and a `--dir`, so the ID decides which database you change.

1. Take the `id` of the `DB` binding in the `ctx.isPreview` branch of `cloudflare.config.ts`. Confirm with `npx cf d1 list` that it belongs to the Preview database, not production's `activity-log-db-cf`. If it doesn't, or the branch has no `DB`, stop and tell the human.
2. Apply: `npx cf d1 migrations apply <preview-db-id> --dir preview-migrations`. Never run it with `--dir migrations` or against production's ID.
3. D1 records applied migrations, so running it again only applies new files. Because the database is shared, a migration applied for one branch shows up in every Preview.

## Testing a Preview

Test against the Preview URL, not `localhost` and not production. The Preview has its own database, so you can add and delete data there freely.

The app's JSON API:

| Method | Path | Does |
| --- | --- | --- |
| `GET` | `/api/entries` | List entries. Each has `id`, `text`, `created_at`. |
| `POST` | `/api/entries` | Add an entry. Body: `{"text": "..."}` |
| `DELETE` | `/api/entries/<id>` | Delete the entry with that `id`. |

A full check covers all three: add an entry, list it, delete it, and list again to confirm it's gone. Report the status codes and response bodies. A `409` means the Preview database is bound but its migrations haven't been applied. An HTML page saying no database is bound means the `ctx.isPreview` branch of `cloudflare.config.ts` has no D1 binding.

## Reading Preview logs

When a request fails, read that Preview's logs instead of guessing. The Worker logs structured events like `activity_log.delete_failed` that include the underlying error.

Use the **Cloudflare Workers Observability MCP server** (`cloudflare-observability`, configured in this repo for common agents). It's read-only.

- Filter on all three fields:
  - `$workers.scriptName` = the Worker `name` in `cloudflare.config.ts`
  - `$workers.preview.slug` = the Preview's name: the branch name, as it appears at the start of the Preview URL's hostname
  - `$metadata.level` = `error`, or `event` = the event name
- Use `view: "events"` and a timeframe covering the last hour. Logs can take a minute to appear.
- If `query_worker_observability` errors while parsing the events response, read the fields you need (for example `error` and `entryId`) with `observability_values`, using the same filters.
- If the tools ask for an `account_id`, use the account the Worker is deployed to (`npx cf auth whoami` lists them).
- Production logs never include Preview traffic. If you don't filter on `$workers.preview.slug`, you may be reading the wrong environment.

If the MCP tools aren't available, say so and ask the human to open the Worker in the Cloudflare dashboard, switch the environment dropdown from **Production** to the branch, and open **Observability**.

## Before you say you're done

1. Push, then wait for the new deployment to show your commit.
2. Re-run the full API check against the Preview URL.
3. Give the human the Preview URL, the results, and what you changed, then let them decide whether to merge.
