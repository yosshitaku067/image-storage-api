import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, normalize, resolve } from "node:path";
import { config } from "../config";

export class StorageError extends Error {
	constructor(message: string, cause?: Error) {
		super(message);
		this.name = "StorageError";
		if (cause) {
			this.cause = cause;
		}
	}
}

/**
 * パスが安全かどうかを検証（ディレクトリトラバーサル攻撃の防止）
 */
const validatePath = (relativePath: string): void => {
	const normalized = normalize(relativePath);

	if (normalized.includes("..") || normalized.startsWith("/")) {
		throw new StorageError("不正なパスが指定されました");
	}
};

/**
 * ファイルの完全なパスを取得
 */
const getFullPath = (relativePath: string): string => {
	validatePath(relativePath);
	return resolve(join(config.imageStoragePath, relativePath));
};

/**
 * ファイルを保存
 */
export const saveFile = async (
	relativePath: string,
	data: Buffer,
): Promise<{ path: string; size: number }> => {
	const fullPath = getFullPath(relativePath);
	const directory = dirname(fullPath);

	try {
		await mkdir(directory, { recursive: true });
		await writeFile(fullPath, data);
		const stats = await stat(fullPath);

		return {
			path: relativePath,
			size: stats.size,
		};
	} catch (error) {
		throw new StorageError(
			`ファイルの保存に失敗しました: ${relativePath}`,
			error instanceof Error ? error : undefined,
		);
	}
};

/**
 * ファイルを読み込み
 */
export const readFileFromStorage = async (
	relativePath: string,
): Promise<Buffer> => {
	const fullPath = getFullPath(relativePath);

	try {
		return await readFile(fullPath);
	} catch (error) {
		throw new StorageError(
			`ファイルの読み込みに失敗しました: ${relativePath}`,
			error instanceof Error ? error : undefined,
		);
	}
};

/**
 * ファイルを削除
 */
export const deleteFile = async (relativePath: string): Promise<void> => {
	const fullPath = getFullPath(relativePath);

	try {
		await unlink(fullPath);
	} catch (error) {
		throw new StorageError(
			`ファイルの削除に失敗しました: ${relativePath}`,
			error instanceof Error ? error : undefined,
		);
	}
};

/**
 * ファイルの存在確認
 */
export const fileExists = async (relativePath: string): Promise<boolean> => {
	const fullPath = getFullPath(relativePath);

	try {
		await stat(fullPath);
		return true;
	} catch {
		return false;
	}
};

/**
 * MIME typeを取得（拡張子ベース）
 */
export const getMimeType = (filename: string): string => {
	const ext = filename.toLowerCase().split(".").pop() ?? "";
	const mimeTypes: Record<string, string> = {
		jpg: "image/jpeg",
		jpeg: "image/jpeg",
		png: "image/png",
		gif: "image/gif",
		webp: "image/webp",
		svg: "image/svg+xml",
		bmp: "image/bmp",
		ico: "image/x-icon",
	};

	return mimeTypes[ext] ?? "application/octet-stream";
};
