import type { Context } from "hono";
import { StorageError } from "../../shared/storage/storage.error";
import { uploadImageSchema } from "./images.schemas";
import {
	deleteImage,
	getImage,
	getImages,
	uploadImage,
} from "./images.service";

/**
 * POST /images - 画像アップロード
 */
export const uploadImageHandler = async (c: Context) => {
	try {
		const body = await c.req.parseBody();

		// Zodでバリデーション
		const validationResult = uploadImageSchema.safeParse(body);

		if (!validationResult.success) {
			const errors = validationResult.error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join(", ");
			return c.json({ error: `バリデーションエラー: ${errors}` }, 400);
		}

		const { path, file } = validationResult.data;

		const fileBuffer = Buffer.from(await file.arrayBuffer());
		const result = await uploadImage(path, fileBuffer);

		return c.json(result, 201);
	} catch (error) {
		if (error instanceof StorageError) {
			return c.json({ error: error.message }, 400);
		}

		console.error("Upload error:", error);
		return c.json(
			{
				error: "画像のアップロードに失敗しました",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
};

/**
 * GET /images - 画像一覧取得
 */
export const listImagesHandler = async (c: Context) => {
	try {
		const { page, limit } = c.req.valid("query");

		const result = await getImages({ page, limit });

		return c.json(result, 200);
	} catch (error) {
		console.error("List error:", error);
		return c.json(
			{
				error: "画像一覧の取得に失敗しました",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
};

/**
 * GET /images/{path} - 画像ファイル取得
 */
export const getImageHandler = async (c: Context) => {
	try {
		const { path } = c.req.valid("param");
		const decodedPath = decodeURIComponent(path);

		const { buffer, filename, mimeType } = await getImage(decodedPath);

		return c.body(new Uint8Array(buffer), 200, {
			"Content-Type": mimeType,
			"Content-Length": buffer.length.toString(),
			"Content-Disposition": `inline; filename="${filename}"`,
		});
	} catch (error) {
		if (error instanceof StorageError) {
			return c.json({ error: "画像ファイルの読み込みに失敗しました" }, 404);
		}

		console.error("Get error:", error);
		return c.json(
			{
				error: "画像の取得に失敗しました",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
};

/**
 * DELETE /images/{path} - 画像削除
 */
export const deleteImageHandler = async (c: Context) => {
	try {
		const { path } = c.req.valid("param");
		const decodedPath = decodeURIComponent(path);

		await deleteImage(decodedPath);

		return c.body(null, 204);
	} catch (error) {
		if (error instanceof StorageError) {
			return c.json({ error: "画像が見つかりません" }, 404);
		}

		console.error("Delete error:", error);
		return c.json(
			{
				error: "画像の削除に失敗しました",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
};
