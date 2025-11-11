import { describe, expect, it } from "vitest";
import { fileExists } from "../../src/lib/storage";
import type { ImageResponse } from "../../src/schemas/image";
import {
	createFormDataWithFile,
	createTestApp,
	createTestImageBuffer,
	createTestJpegBuffer,
} from "../helpers/test-utils";

describe("POST /api/images - 画像アップロード", () => {
	const app = createTestApp();

	it("正常に画像をアップロードできる", async () => {
		const imageBuffer = createTestImageBuffer();
		const formData = createFormDataWithFile(
			"test/image.png",
			imageBuffer,
			"image.png",
		);

		const res = await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(201);

		const data = (await res.json()) as ImageResponse;
		expect(data.filename).toBe("image.png");
		expect(data.path).toBe("test/image.png");
		expect(data.size).toBeGreaterThan(0);
		expect(data).toHaveProperty("uploadedAt");
		expect(data).toHaveProperty("updatedAt");

		const exists = await fileExists(data.path);
		expect(exists).toBe(true);
	});

	it("サブディレクトリを自動作成して画像を保存できる", async () => {
		const imageBuffer = createTestJpegBuffer();
		const formData = createFormDataWithFile(
			"user/123/avatar/profile.jpg",
			imageBuffer,
			"profile.jpg",
		);

		const res = await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(201);

		const data = (await res.json()) as ImageResponse;
		expect(data.path).toBe("user/123/avatar/profile.jpg");
		expect(data.filename).toBe("profile.jpg");

		const exists = await fileExists(data.path);
		expect(exists).toBe(true);
	});

	it("pathが空の場合はエラーを返す", async () => {
		const imageBuffer = createTestImageBuffer();
		const formData = new FormData();
		formData.append("path", "");
		formData.append("file", new Blob([imageBuffer]), "image.png");

		const res = await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data).toHaveProperty("error");
	});

	it("fileが空の場合はエラーを返す", async () => {
		const formData = new FormData();
		formData.append("path", "test/image.png");

		const res = await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data).toHaveProperty("error");
	});

	it("不正なパス（ディレクトリトラバーサル）はエラーを返す", async () => {
		const imageBuffer = createTestImageBuffer();
		const formData = createFormDataWithFile(
			"../../../etc/passwd",
			imageBuffer,
			"passwd",
		);

		const res = await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data).toHaveProperty("error");
	});

	it.skip("複数の画像を順次アップロードできる", async () => {
		const timestamp = Date.now();
		const images = [
			{
				path: `batch/image1-${timestamp}.png`,
				filename: "image1.png",
			},
			{
				path: `batch/image2-${timestamp}.jpg`,
				filename: "image2.jpg",
			},
			{
				path: `batch/image3-${timestamp}.png`,
				filename: "image3.png",
			},
		];

		const uploadedPaths: string[] = [];

		for (const image of images) {
			const buffer = image.filename.endsWith(".jpg")
				? createTestJpegBuffer()
				: createTestImageBuffer();
			const formData = createFormDataWithFile(
				image.path,
				buffer,
				image.filename,
			);

			const res = await app.request("/api/images", {
				method: "POST",
				body: formData,
			});

			expect(res.status).toBe(201);
			const data = (await res.json()) as ImageResponse;
			uploadedPaths.push(data.path);
		}

		expect(uploadedPaths).toHaveLength(3);

		for (const path of uploadedPaths) {
			const exists = await fileExists(path);
			if (!exists) {
				console.log("File not found:", path);
				console.log("All uploaded paths:", uploadedPaths);
			}
			expect(exists).toBe(true);
		}
	});
});
