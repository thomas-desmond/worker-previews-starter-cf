// A small label showing where this page is being served from. The value
// comes from the `ENVIRONMENT` var: "production" at the top level of
// wrangler.json and "preview" in the `previews` block. Previews don't
// inherit production vars, so without `previews.vars` the value is missing.

type BadgeKind = "production" | "preview" | "unknown";

function badgeKind(environment: string | undefined): BadgeKind {
	if (environment === "production") return "production";
	if (environment === "preview") return "preview";
	return "unknown";
}

const LABELS: Record<BadgeKind, string> = {
	production: "Production",
	preview: "Preview",
	unknown: "Environment not set",
};

export const environmentBadgeCss = `
  .env-badge { display: inline-block; margin-bottom: 0.75rem; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid transparent; }
  .env-badge--production { background: #ecfdf5; color: #065f46; border-color: #6ee7b7; }
  .env-badge--preview { background: #fff7ed; color: #9a3412; border-color: #fdba74; }
  .env-badge--unknown { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
`;

export function renderEnvironmentBadge(environment: string | undefined): string {
	const kind = badgeKind(environment);
	return `<span class="env-badge env-badge--${kind}">${LABELS[kind]}</span>`;
}
