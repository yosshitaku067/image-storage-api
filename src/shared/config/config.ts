import { resolve } from "node:path";
import { config as dotenvConfig } from "dotenv";

// テスト環境以外では.envファイルをロード
if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
	dotenvConfig();
}

const getEnv = (key: string, defaultValue?: string): string => {
	const value = process.env[key] ?? defaultValue;
	if (!value) {
		throw new Error(`環境変数 ${key} が設定されていません`);
	}
	return value;
};

export const config = {
	port: Number.parseInt(getEnv("PORT", "3000"), 10),
	imageStoragePath: resolve(getEnv("IMAGE_STORAGE_PATH", "./uploads")),
} as const;
