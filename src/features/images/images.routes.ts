import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
	deleteImageHandler,
	getImageHandler,
	listImagesHandler,
	uploadImageHandler,
} from "./images.controller";
import {
	errorResponseSchema,
	imageResponseSchema,
	listImagesQuerySchema,
	listImagesResponseSchema,
	uploadImageSchema,
} from "./images.schemas";

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

app.openapi(uploadRoute, uploadImageHandler);

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

app.openapi(listRoute, listImagesHandler);

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

app.openapi(getRoute, getImageHandler);

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

app.openapi(deleteRoute, deleteImageHandler);

export default app;
