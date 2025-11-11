import { describe, expect, it } from "vitest";
import type {
	ImageResponse,
	ListImagesResponse,
} from "../../src/schemas/image";
import {
	createFormDataWithFile,
	createTestApp,
	createTestImageBuffer,
} from "../helpers/test-utils";

describe("GET /api/images - 画像一覧取得", () => {
	const app = createTestApp();

	const uploadTestImages = async (count: number) => {
		const uploadedPaths: string[] = [];
		const timestamp = Date.now();

		for (let i = 0; i < count; i++) {
			const imageBuffer = createTestImageBuffer();
			const path = `test/image${timestamp}-${i}.png`;
			const formData = createFormDataWithFile(
				path,
				imageBuffer,
				`image${i}.png`,
			);

			const res = await app.request("/api/images", {
				method: "POST",
				body: formData,
			});

			const data = (await res.json()) as ImageResponse;
			uploadedPaths.push(data.path);
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		return uploadedPaths;
	};

	it("画像が0件の場合、空の配列を返す", async () => {
		const res = await app.request("/api/images");

		expect(res.status).toBe(200);

		const data = (await res.json()) as ListImagesResponse;
		expect(data.images).toEqual([]);
		expect(data.pagination).toEqual({
			total: 0,
			page: 1,
			limit: 20,
			totalPages: 0,
		});
	});

	it.skip("デフォルトでページ1、1ページ20件で取得できる", async () => {
		await uploadTestImages(5);

		const res = await app.request("/api/images");

		expect(res.status).toBe(200);

		const data = (await res.json()) as ListImagesResponse;
		expect(data.images).toHaveLength(5);
		expect(data.pagination.total).toBe(5);
		expect(data.pagination.page).toBe(1);
		expect(data.pagination.limit).toBe(20);
		expect(data.pagination.totalPages).toBe(1);
	});

	it("limitパラメータで取得件数を制御できる", async () => {
		await uploadTestImages(10);

		const res = await app.request("/api/images?limit=5");

		expect(res.status).toBe(200);

		const data = (await res.json()) as ListImagesResponse;
		expect(data.images).toHaveLength(5);
		expect(data.pagination.total).toBe(10);
		expect(data.pagination.limit).toBe(5);
		expect(data.pagination.totalPages).toBe(2);
	});

	it("pageパラメータでページネーションできる", async () => {
		await uploadTestImages(15);

		const res1 = await app.request("/api/images?page=1&limit=10");
		const data1 = (await res1.json()) as ListImagesResponse;
		expect(data1.images).toHaveLength(10);
		expect(data1.pagination.page).toBe(1);

		const res2 = await app.request("/api/images?page=2&limit=10");
		const data2 = (await res2.json()) as ListImagesResponse;
		expect(data2.images).toHaveLength(5);
		expect(data2.pagination.page).toBe(2);

		const firstPagePaths = data1.images.map(
			(img: { path: string }) => img.path,
		);
		const secondPagePaths = data2.images.map(
			(img: { path: string }) => img.path,
		);
		const intersection = firstPagePaths.filter((path: string) =>
			secondPagePaths.includes(path),
		);
		expect(intersection).toHaveLength(0);
	});

	it("limitは最大100件まで", async () => {
		await uploadTestImages(5);

		const res = await app.request("/api/images?limit=150");

		expect(res.status).toBe(400);
	});

	it("最新の画像が先頭に来る（降順）", async () => {
		const paths = await uploadTestImages(3);

		const res = await app.request("/api/images");
		const data = (await res.json()) as ListImagesResponse;

		expect(data.images[0].path).toBe(paths[2]);
		expect(data.images[1].path).toBe(paths[1]);
		expect(data.images[2].path).toBe(paths[0]);
	});

	it("不正なpageパラメータの場合はエラー", async () => {
		const res = await app.request("/api/images?page=0");

		expect(res.status).toBe(400);
	});

	it("不正なlimitパラメータの場合はエラー", async () => {
		const res = await app.request("/api/images?limit=0");

		expect(res.status).toBe(400);
	});

	it("存在しないページ番号を指定しても空の配列を返す", async () => {
		await uploadTestImages(5);

		const res = await app.request("/api/images?page=10");

		expect(res.status).toBe(200);

		const data = (await res.json()) as ListImagesResponse;
		expect(data.images).toEqual([]);
		expect(data.pagination.total).toBe(5);
		expect(data.pagination.page).toBe(10);
	});

	it("画像のメタデータが正しく取得できる", async () => {
		const imageBuffer = createTestImageBuffer();
		const formData = createFormDataWithFile(
			"test/metadata.png",
			imageBuffer,
			"metadata.png",
		);

		await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		const res = await app.request("/api/images");
		const data = (await res.json()) as ListImagesResponse;

		expect(data.images[0]).toHaveProperty("path");
		expect(data.images[0]).toHaveProperty("filename");
		expect(data.images[0]).toHaveProperty("size");
		expect(data.images[0]).toHaveProperty("uploadedAt");
		expect(data.images[0]).toHaveProperty("updatedAt");
		expect(data.images[0].path).toBe("test/metadata.png");
		expect(data.images[0].filename).toBe("metadata.png");
	});
});
