/**
 * 画像アップロード入力
 */
export type UploadImageInput = {
	path: string;
	file: File | Blob;
};

/**
 * 画像レスポンス
 */
export type ImageResponse = {
	path: string;
	filename: string;
	size: number;
	uploadedAt: string;
	updatedAt: string;
};

/**
 * 画像一覧取得クエリ
 */
export type ListImagesQuery = {
	page: number;
	limit: number;
};

/**
 * ページネーション情報
 */
export type Pagination = {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

/**
 * 画像一覧レスポンス
 */
export type ListImagesResponse = {
	images: ImageResponse[];
	pagination: Pagination;
};

/**
 * エラーレスポンス
 */
export type ErrorResponse = {
	error: string;
	details?: string;
};
