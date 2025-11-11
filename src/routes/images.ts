import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Image } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
	deleteFile,
	getMimeType,
	readFileFromStorage,
	StorageError,
	saveFile,
} from "../lib/storage";
import {
	errorResponseSchema,
	imageResponseSchema,
	listImagesQuerySchema,
	listImagesResponseSchema,
} from "../schemas/image";

const app = new OpenAPIHono();

/**
 * Prisma ImageをImageResponseに変換
 */
const toImageResponse = (image: Image) => ({
	id: image.id,
	filename: image.filename,
	path: image.path,
	size: image.size,
	mimeType: image.mimeType,
	width: image.width,
	height: image.height,
	tags: image.tags ? JSON.parse(image.tags) : null,
	description: image.description,
	uploadedAt: image.uploadedAt.toISOString(),
	updatedAt: image.updatedAt.toISOString(),
});

/**
 * POST /images - 画像アップロード
 */
const uploadRoute = createRoute({
	method: "post",
	path: "/",
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
		const path = body.path as string;
		const file = body.file as File;
		const description = (body.description as string) ?? null;
		const tagsString = body.tags as string | undefined;

		if (!path || !file) {
			return c.json({ error: "pathとfileは必須です" }, 400);
		}

		if (!(file instanceof File)) {
			return c.json({ error: "fileは有効なファイルである必要があります" }, 400);
		}

		const fileBuffer = Buffer.from(await file.arrayBuffer());
		const filename = path.split("/").pop() ?? "unknown";
		const mimeType = getMimeType(filename);

		const { size } = await saveFile(path, fileBuffer);

		const tags = tagsString ? tagsString.split(",").map((t) => t.trim()) : null;

		const image = await prisma.image.create({
			data: {
				filename,
				path,
				size,
				mimeType,
				width: null,
				height: null,
				tags: tags ? JSON.stringify(tags) : null,
				description,
			},
		});

		return c.json(toImageResponse(image), 201);
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

		const skip = (page - 1) * limit;

		const [images, total] = await Promise.all([
			prisma.image.findMany({
				skip,
				take: limit,
				orderBy: {
					uploadedAt: "desc",
				},
			}),
			prisma.image.count(),
		]);

		const totalPages = Math.ceil(total / limit);

		return c.json({
			images: images.map(toImageResponse),
			pagination: {
				total,
				page,
				limit,
				totalPages,
			},
		});
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
 * GET /images/:id - 画像ファイル取得
 */
const getRoute = createRoute({
	method: "get",
	path: "/{id}",
	request: {
		params: z.object({
			id: z
				.string()
				.uuid()
				.openapi({
					description: "画像のID",
					example: "550e8400-e29b-41d4-a716-446655440000",
					param: {
						name: "id",
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
		const { id } = c.req.valid("param");

		const image = await prisma.image.findUnique({
			where: { id },
		});

		if (!image) {
			return c.json({ error: "画像が見つかりません" }, 404);
		}

		const fileBuffer = await readFileFromStorage(image.path);

		return c.body(fileBuffer, 200, {
			"Content-Type": image.mimeType,
			"Content-Length": image.size.toString(),
			"Content-Disposition": `inline; filename="${image.filename}"`,
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
 * DELETE /images/:id - 画像削除
 */
const deleteRoute = createRoute({
	method: "delete",
	path: "/{id}",
	request: {
		params: z.object({
			id: z
				.string()
				.uuid()
				.openapi({
					description: "画像のID",
					example: "550e8400-e29b-41d4-a716-446655440000",
					param: {
						name: "id",
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
		const { id } = c.req.valid("param");

		const image = await prisma.image.findUnique({
			where: { id },
		});

		if (!image) {
			return c.json({ error: "画像が見つかりません" }, 404);
		}

		await deleteFile(image.path);

		await prisma.image.delete({
			where: { id },
		});

		return c.body(null, 204);
	} catch (error) {
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
