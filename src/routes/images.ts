import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	deleteFile,
	getMimeType,
	listAllFiles,
	readFileFromStorage,
	StorageError,
	saveFile,
} from "../lib/storage";
import {
	errorResponseSchema,
	imageResponseSchema,
	listImagesQuerySchema,
	listImagesResponseSchema,
	uploadImageSchema,
} from "../schemas/image";

const app = new OpenAPIHono();

/**
 * POST /images - 画像アップロード
 */
const uploadRoute = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: uploadImageSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: imageResponseSchema,
				},
			},
			description: "画像が正常にアップロードされました",
		},
		400: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "リクエストが不正です",
		},
		500: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Images"],
});

app.openapi(uploadRoute, async (c) => {
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
		const filename = path.split("/").pop() ?? "unknown";

		const { size } = await saveFile(path, fileBuffer);

		return c.json(
			{
				path,
				filename,
				size,
				uploadedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			201,
		);
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
});

/**
 * GET /images - 画像一覧取得
 */
const listRoute = createRoute({
	method: "get",
	path: "/",
	request: {
		query: listImagesQuerySchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: listImagesResponseSchema,
				},
			},
			description: "画像一覧を取得しました",
		},
		400: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "リクエストが不正です",
		},
		500: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Images"],
});

app.openapi(listRoute, async (c) => {
	try {
		const { page, limit } = c.req.valid("query");

		const allFiles = await listAllFiles();
		const total = allFiles.length;
		const totalPages = Math.ceil(total / limit);

		const skip = (page - 1) * limit;
		const paginatedFiles = allFiles.slice(skip, skip + limit);

		return c.json(
			{
				images: paginatedFiles.map((file) => ({
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
			},
			200,
		);
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
});

/**
 * GET /images/{path} - 画像ファイル取得（パスベース）
 */
const getRoute = createRoute({
	method: "get",
	path: "/{path}",
	request: {
		params: z.object({
			path: z.string().openapi({
				description: "画像のパス",
				example: "user/123/profile.png",
				param: {
					name: "path",
					in: "path",
				},
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"image/*": {
					schema: {
						type: "string",
						format: "binary",
					},
				},
			},
			description: "画像ファイルを取得しました",
		},
		404: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "画像が見つかりません",
		},
		500: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Images"],
});

app.openapi(getRoute, async (c) => {
	try {
		const { path } = c.req.valid("param");
		const decodedPath = decodeURIComponent(path);

		const fileBuffer = await readFileFromStorage(decodedPath);
		const filename = decodedPath.split("/").pop() ?? "image";
		const mimeType = getMimeType(filename);

		return c.body(new Uint8Array(fileBuffer), 200, {
			"Content-Type": mimeType,
			"Content-Length": fileBuffer.length.toString(),
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
});

/**
 * DELETE /images/{path} - 画像削除（パスベース）
 */
const deleteRoute = createRoute({
	method: "delete",
	path: "/{path}",
	request: {
		params: z.object({
			path: z.string().openapi({
				description: "画像のパス",
				example: "user/123/profile.png",
				param: {
					name: "path",
					in: "path",
				},
			}),
		}),
	},
	responses: {
		204: {
			description: "画像が削除されました",
		},
		404: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "画像が見つかりません",
		},
		500: {
			content: {
				"application/json": {
					schema: errorResponseSchema,
				},
			},
			description: "サーバーエラー",
		},
	},
	tags: ["Images"],
});

app.openapi(deleteRoute, async (c) => {
	try {
		const { path } = c.req.valid("param");
		const decodedPath = decodeURIComponent(path);

		await deleteFile(decodedPath);

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
});

export default app;
