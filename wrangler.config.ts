import { defineWranglerConfig } from "wrangler/experimental-config";

export default defineWranglerConfig((ctx) => {
	if (ctx.isPreview) {
		return {
			uploadSourceMaps: true,
		};
	}
	return {
		uploadSourceMaps: true,
	};
});
