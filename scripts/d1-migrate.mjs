// Apply D1 migrations by database *name*.
//
// `cf d1 migrations apply` only accepts a database ID, but the production
// database is bound by name in cloudflare.config.ts (the ID doesn't exist until
// the first deploy provisions it). This looks the ID up with `cf d1 list`, then
// applies the migrations.
//
// Usage:
//   node scripts/d1-migrate.mjs <database-name> [--dir <folder>] [--local]
//
// --local applies to the local dev state that `cf dev` reads (.wrangler/state).

import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--dir");
const dirIndex = args.indexOf("--dir");
const dir = dirIndex === -1 ? "migrations" : args[dirIndex + 1];
const local = args.includes("--local");

if (!name) {
	console.error("Usage: node scripts/d1-migrate.mjs <database-name> [--dir <folder>] [--local]");
	process.exit(1);
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function findRemoteId(dbName) {
	const out = execFileSync("npx", ["cf", "d1", "list", "--per-page", "100"], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "inherit"],
	});

	// Prefer structured output if cf returns JSON.
	try {
		const parsed = JSON.parse(out);
		const list = Array.isArray(parsed) ? parsed : (parsed.result ?? parsed.databases ?? []);
		const match = list.find((db) => db.name === dbName);
		if (match) return match.uuid ?? match.id;
	} catch {
		// Not JSON: fall back to scanning lines for the name and a UUID.
	}
	const line = out
		.split("\n")
		.find((l) => l.split(/[\s│|,"]+/).includes(dbName) && UUID.test(l));
	return line?.match(UUID)?.[0];
}

let target;
if (local) {
	// Local dev has no account to look the ID up in. Use the name; the local
	// simulator keys name-only bindings by name.
	target = name;
} else {
	target = findRemoteId(name);
	if (!target) {
		console.error(`No D1 database named "${name}" in this account. Has it been deployed yet?`);
		process.exit(1);
	}
	console.log(`Resolved D1 database "${name}" -> ${target}`);
}

const cfArgs = ["cf", "d1", "migrations", "apply", target, "--dir", dir];
if (local) cfArgs.push("--local", "--persist-to", ".wrangler/state");

console.log(`> npx ${cfArgs.join(" ")}`);
execFileSync("npx", cfArgs, { stdio: "inherit" });
