import { z } from "zod";

/**
 * 画像アップロードリクエスト
 */
export const uploadImageSchema = z.object({
	path: z
		.string()
		.min(1, "パスは必須です")
		.regex(/^[^./][^/]*(\.[^/]+)?$|^[^./][^/]*\//, "不正なパス形式です")
		.openapi({
			description: "画像の保存先パス（例: user/avatar/image.png）",
			example: "user/123/profile.png",
		}),
	file: z
		.custom<File | Blob>(
			(val) => val instanceof File || val instanceof Blob,
			"ファイルが必要です",
		)
		.refine((file) => file.size > 0, "ファイルが空です")
		.refine(
			(file) => file.size <= 10 * 1024 * 1024,
			"ファイルサイズは10MB以下にしてください",
		)
		.openapi({
			description: "アップロードする画像ファイル",
			type: "string",
			format: "binary",
		}),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

/**
 * 画像レスポンス
 */
export const imageResponseSchema = z
	.object({
		path: z.string().openapi({
			description: "ファイルパス",
			example: "user/123/profile.png",
		}),
		filename: z.string().openapi({
			description: "ファイル名",
			example: "profile.png",
		}),
		size: z.number().int().positive().openapi({
			description: "ファイルサイズ（バイト）",
			example: 153600,
		}),
		uploadedAt: z.string().datetime().openapi({
			description: "アップロード日時",
			example: "2024-01-15T10:30:00.000Z",
		}),
		updatedAt: z.string().datetime().openapi({
			description: "更新日時",
			example: "2024-01-15T10:30:00.000Z",
		}),
	})
	.openapi("Image");

export type ImageResponse = z.infer<typeof imageResponseSchema>;

/**
 * 画像一覧取得クエリ
 */
export const listImagesQuerySchema = z.object({
	page: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : 1))
		.pipe(z.number().int().positive())
		.openapi({
			description: "ページ番号（デフォルト: 1）",
			example: "1",
			param: {
				name: "page",
				in: "query",
			},
		}),
	limit: z
		.string()
		.optional()
		.transform((val) => (val ? Number.parseInt(val, 10) : 20))
		.pipe(z.number().int().positive().max(100))
		.openapi({
			description: "1ページあたりの件数（デフォルト: 20、最大: 100）",
			example: "20",
			param: {
				name: "limit",
				in: "query",
			},
		}),
});

export type ListImagesQuery = z.infer<typeof listImagesQuerySchema>;

/**
 * ページネーション情報
 */
export const paginationSchema = z.object({
	total: z.number().int().nonnegative().openapi({
		description: "総件数",
		example: 150,
	}),
	page: z.number().int().positive().openapi({
		description: "現在のページ番号",
		example: 1,
	}),
	limit: z.number().int().positive().openapi({
		description: "1ページあたりの件数",
		example: 20,
	}),
	totalPages: z.number().int().nonnegative().openapi({
		description: "総ページ数",
		example: 8,
	}),
});

export type Pagination = z.infer<typeof paginationSchema>;

/**
 * 画像一覧レスポンス
 */
export const listImagesResponseSchema = z
	.object({
		images: z.array(imageResponseSchema).openapi({
			description: "画像のリスト",
		}),
		pagination: paginationSchema.openapi({
			description: "ページネーション情報",
		}),
	})
	.openapi("ImageList");

export type ListImagesResponse = z.infer<typeof listImagesResponseSchema>;

/**
 * エラーレスポンス
 */
export const errorResponseSchema = z
	.object({
		error: z.string().openapi({
			description: "エラーメッセージ",
			example: "画像が見つかりません",
		}),
		details: z.string().optional().openapi({
			description: "エラーの詳細情報",
		}),
	})
	.openapi("Error");

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
