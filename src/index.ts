import { renderHtml } from "./renderHtml";
import { renderNoDatabaseHtml } from "./renderNoDatabaseHtml";

type Entry = {
	id: number;
	text: string;
	created_at: string;
};

async function hasSchema(db: D1Database): Promise<boolean> {
	const table = await db
		.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'activity_log'")
		.first<{ name: string }>();
	return table !== null;
}

async function listEntries(db: D1Database): Promise<Entry[]> {
	const { results } = await db
		.prepare("SELECT rowid AS id, text, created_at FROM activity_log ORDER BY rowid DESC LIMIT 50")
		.all<Entry>();
	return results;
}

function json(data: unknown, init: ResponseInit = {}): Response {
	return new Response(JSON.stringify(data), {
		...init,
		headers: { "content-type": "application/json", ...init.headers },
	});
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const { pathname } = url;
		// "production" or "preview", from wrangler.json. Typed loosely because
		// generated types only see the top-level value.
		const environment = (env as { ENVIRONMENT?: string }).ENVIRONMENT;

		// A Preview only gets a `DB` binding if `wrangler.json` has a
		// `previews.d1_databases` override for it — Cloudflare does not fall
		// back to the production binding. Without that override, `env.DB` is
		// `undefined` here, not an empty/unmigrated database. This is the
		// isolation mechanic the workshop's D1-override step is about: no
		// override, no database, not even a read-only fallback to prod.
		if (!env.DB) {
			if (pathname.startsWith("/api/")) {
				return json(
					{ error: "No D1 database bound. Add a previews.d1_databases override." },
					{ status: 503 },
				);
			}
			// 200, not an error status: this is an expected, legitimate app
			// state (no override configured yet), not a crash.
			return new Response(renderNoDatabaseHtml("missing-binding", environment), {
				headers: { "content-type": "text/html" },
			});
		}

		if (!(await hasSchema(env.DB))) {
			if (pathname.startsWith("/api/")) {
				return json(
					{ error: "The Preview database is connected, but its schema has not been applied." },
					{ status: 409 },
				);
			}
			return new Response(renderNoDatabaseHtml("missing-schema", environment), {
				headers: { "content-type": "text/html" },
			});
		}

		if (pathname === "/api/entries" && request.method === "GET") {
			return json({ entries: await listEntries(env.DB) });
		}

		if (pathname === "/api/entries" && request.method === "POST") {
			const body = await request
				.json<{ text?: string }>()
				.catch(() => ({}) as { text?: string });
			const text = body.text?.trim();
			if (!text) {
				return json({ error: "text is required" }, { status: 400 });
			}
			await env.DB.prepare("INSERT INTO activity_log (text) VALUES (?)").bind(text).run();
			return json({ entries: await listEntries(env.DB) }, { status: 201 });
		}

		const deleteMatch = pathname.match(/^\/api\/entries\/(\d+)$/);
		if (deleteMatch && request.method === "DELETE") {
			const id = Number(deleteMatch[1]);
			try {
				await env.DB.prepare("DELETE FROM activity_log WHERE id = ?").bind(id).run();
				return json({ entries: await listEntries(env.DB) });
			} catch (error) {
				console.error({
					event: "activity_log.delete_failed",
					entryId: id,
					error: error instanceof Error ? error.message : String(error),
				});
				return json(
					{ error: "Delete failed. Your data is unchanged. Check this Preview's Observability logs." },
					{ status: 500 },
				);
			}
		}

		if (pathname === "/" && request.method === "GET") {
			return new Response(renderHtml(environment), {
				headers: { "content-type": "text/html" },
			});
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;
