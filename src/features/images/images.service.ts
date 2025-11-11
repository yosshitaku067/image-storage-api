import type { FileInfo } from "../../shared/storage/storage.service";
import {
	deleteFile as deleteFileFromStorage,
	getMimeType,
	listAllFiles,
	readFileFromStorage,
	saveFile,
} from "../../shared/storage/storage.service";
import type { ImageResponse, ListImagesQuery, ListImagesResponse } from "./images.types";

/**
 * 画像をアップロード
 */
export const uploadImage = async (
	path: string,
	fileBuffer: Buffer,
): Promise<ImageResponse> => {
	const filename = path.split("/").pop() ?? "unknown";
	const { size } = await saveFile(path, fileBuffer);

	return {
		path,
		filename,
		size,
		uploadedAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
};

/**
 * 画像一覧を取得
 */
export const getImages = async (
	query: ListImagesQuery,
): Promise<ListImagesResponse> => {
	const { page, limit } = query;

	const allFiles = await listAllFiles();
	const total = allFiles.length;
	const totalPages = Math.ceil(total / limit);

	const skip = (page - 1) * limit;
	const paginatedFiles = allFiles.slice(skip, skip + limit);

	return {
		images: paginatedFiles.map((file: FileInfo) => ({
			path: file.path,
			filename: file.filename,
			size: file.size,
			uploadedAt: file.uploadedAt.toISOString(),
			updatedAt: file.updatedAt.toISOString(),
		})),
		pagination: {
			total,
			page,
			limit,
			totalPages,
		},
	};
};

/**
 * 画像を取得
 */
export const getImage = async (
	path: string,
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> => {
	const fileBuffer = await readFileFromStorage(path);
	const filename = path.split("/").pop() ?? "image";
	const mimeType = getMimeType(filename);

	return {
		buffer: fileBuffer,
		filename,
		mimeType,
	};
};

/**
 * 画像を削除
 */
export const deleteImage = async (path: string): Promise<void> => {
	await deleteFileFromStorage(path);
};
