import { bindings, defineConfig } from "cf/config";

export default defineConfig((ctx) => {
	// Preview settings live in this branch. Previews don't inherit production
	// vars or bindings: add Preview-only bindings (like the Preview D1 database)
	// here. Never point a binding in this branch at a production resource.
	// A Preview D1 database's migrations live in `preview-migrations/` and are
	// applied with `cf d1 migrations apply <id> --dir preview-migrations`.
	if (ctx.isPreview) {
		return {
			worker: {
				name: "worker-previews-starter-cf",
				compatibilityDate: "2025-10-08",
				entrypoint: "src/index.ts",
				observability: {
					enabled: true,
				},
				env: {
					ENVIRONMENT: bindings.text("preview"),
				},
			},
		};
	}

	// Production settings live in this branch.
	return {
		worker: {
			name: "worker-previews-starter-cf",
			compatibilityDate: "2025-10-08",
			entrypoint: "src/index.ts",
			observability: {
				enabled: true,
			},
			env: {
				ENVIRONMENT: bindings.text("production"),
				// Name only: `cf deploy` (and the Deploy button) provisions it on
				// first deploy. `npm run predeploy` applies `migrations/` to it.
				DB: bindings.d1({ name: "activity-log-db-cf" }),
			},
		},
	};
});
