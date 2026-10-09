import { environmentBadgeCss, renderEnvironmentBadge } from "./environmentBadge";

type DatabaseSetupState = "missing-binding" | "missing-schema";

export function renderNoDatabaseHtml(state: DatabaseSetupState, environment: string | undefined) {
	const missingBinding = state === "missing-binding";
	const title = missingBinding ? "No Preview database bound" : "Preview database needs a schema";
	const message = missingBinding
		? "This Preview doesn't have a D1 database bound yet."
		: "Your Preview database is connected, but it doesn't have the workshop schema yet.";
	const instructions = missingBinding
		? `Add a <code>previews.d1_databases</code> override in
				<code>wrangler.json</code> pointing at a Preview-safe D1 database,
				then push the branch again.`
		: `Apply <code>preview-migrations/</code> to the Preview database with
				<code>cf d1 migrations apply &lt;preview-db-id&gt; --dir preview-migrations</code>, then refresh this page.
				Production will not be touched.`;

	return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Activity Log — ${title}</title>
        <link rel="stylesheet" type="text/css" href="https://static.integrations.cloudflare.com/styles.css">
        <style>${environmentBadgeCss}</style>
      </head>

      <body>
        <header>
          <img
            src="https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/30e0d3f6-6076-40f8-7abb-8a7676f83c00/public"
          />
          ${renderEnvironmentBadge(environment)}
          <h1>Activity Log</h1>
          <p>${message}</p>
        </header>
        <main>
          <p>
            ${instructions}
          </p>
        </main>
      </body>
    </html>
`;
}
