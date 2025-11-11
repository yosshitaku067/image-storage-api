import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		env: {
			IMAGE_STORAGE_PATH: resolve(process.cwd(), "test-storage"),
		},
		setupFiles: ["./tests/setup.ts"],
		testTimeout: 30000,
		hookTimeout: 30000,
		fileParallelism: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "dist/", "**/*.test.ts", "**/*.spec.ts"],
		},
	},
});
