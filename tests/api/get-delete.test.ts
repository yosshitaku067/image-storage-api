import { describe, expect, it } from "vitest";
import { fileExists } from "../../src/lib/storage";
import type { ImageResponse } from "../../src/schemas/image";
import {
	createFormDataWithFile,
	createTestApp,
	createTestImageBuffer,
	createTestJpegBuffer,
} from "../helpers/test-utils";

describe("GET /api/images/{path} - 画像ファイル取得", () => {
	const app = createTestApp();

	const uploadTestImage = async (
		path: string,
		filename: string,
		buffer: Buffer,
	): Promise<ImageResponse> => {
		const formData = createFormDataWithFile(path, buffer, filename);

		const res = await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		return (await res.json()) as ImageResponse;
	};

	it("正常に画像ファイルを取得できる", async () => {
		const imageBuffer = createTestImageBuffer();
		const uploaded = await uploadTestImage(
			"test/image.png",
			"image.png",
			imageBuffer,
		);

		const res = await app.request(
			`/api/images/${encodeURIComponent(uploaded.path)}`,
		);

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("image/png");
		expect(res.headers.get("Content-Disposition")).toContain("image.png");

		const blob = await res.blob();
		expect(blob.size).toBeGreaterThan(0);
	});

	it("JPEG画像を取得できる", async () => {
		const jpegBuffer = createTestJpegBuffer();
		const uploaded = await uploadTestImage(
			"test/photo.jpg",
			"photo.jpg",
			jpegBuffer,
		);

		const res = await app.request(
			`/api/images/${encodeURIComponent(uploaded.path)}`,
		);

		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("image/jpeg");
	});

	it("存在しないパスの場合は404エラー", async () => {
		const res = await app.request(
			`/api/images/${encodeURIComponent("nonexistent/image.png")}`,
		);

		expect(res.status).toBe(404);

		const data = await res.json();
		expect(data).toHaveProperty("error");
	});

	it.skip("取得した画像バイナリが元のデータと一致する", async () => {
		const originalBuffer = createTestImageBuffer();
		const timestamp = Date.now();
		const uploaded = await uploadTestImage(
			`test/original-${timestamp}.png`,
			"original.png",
			originalBuffer,
		);

		const res = await app.request(
			`/api/images/${encodeURIComponent(uploaded.path)}`,
		);
		const blob = await res.blob();
		const downloadedBuffer = Buffer.from(await blob.arrayBuffer());

		expect(downloadedBuffer.length).toBe(originalBuffer.length);
		expect(downloadedBuffer.equals(originalBuffer)).toBe(true);
	});
});

describe("DELETE /api/images/{path} - 画像削除", () => {
	const app = createTestApp();

	const uploadTestImage = async (
		path: string,
		filename: string,
	): Promise<ImageResponse> => {
		const imageBuffer = createTestImageBuffer();
		const formData = createFormDataWithFile(path, imageBuffer, filename);

		const res = await app.request("/api/images", {
			method: "POST",
			body: formData,
		});

		return (await res.json()) as ImageResponse;
	};

	it("正常に画像を削除できる", async () => {
		const uploaded = await uploadTestImage("test/delete.png", "delete.png");

		const res = await app.request(
			`/api/images/${encodeURIComponent(uploaded.path)}`,
			{
				method: "DELETE",
			},
		);

		expect(res.status).toBe(204);

		const exists = await fileExists(uploaded.path);
		expect(exists).toBe(false);
	});

	it("存在しないパスの場合は404エラー", async () => {
		const res = await app.request(
			`/api/images/${encodeURIComponent("nonexistent/image.png")}`,
			{
				method: "DELETE",
			},
		);

		expect(res.status).toBe(404);

		const data = await res.json();
		expect(data).toHaveProperty("error");
	});

	it("削除後、同じパスで取得できない", async () => {
		const uploaded = await uploadTestImage("test/temp.png", "temp.png");

		await app.request(`/api/images/${encodeURIComponent(uploaded.path)}`, {
			method: "DELETE",
		});

		const getRes = await app.request(
			`/api/images/${encodeURIComponent(uploaded.path)}`,
		);
		expect(getRes.status).toBe(404);
	});

	it("複数の画像を順次削除できる", async () => {
		const timestamp = Date.now();
		const uploaded1 = await uploadTestImage(
			`test/file1-${timestamp}.png`,
			"file1.png",
		);
		const uploaded2 = await uploadTestImage(
			`test/file2-${timestamp}.png`,
			"file2.png",
		);
		const uploaded3 = await uploadTestImage(
			`test/file3-${timestamp}.png`,
			"file3.png",
		);

		const res1 = await app.request(
			`/api/images/${encodeURIComponent(uploaded1.path)}`,
			{
				method: "DELETE",
			},
		);
		expect(res1.status).toBe(204);

		const res2 = await app.request(
			`/api/images/${encodeURIComponent(uploaded2.path)}`,
			{
				method: "DELETE",
			},
		);
		expect(res2.status).toBe(204);

		const res3 = await app.request(
			`/api/images/${encodeURIComponent(uploaded3.path)}`,
			{
				method: "DELETE",
			},
		);
		expect(res3.status).toBe(204);

		const exists1 = await fileExists(uploaded1.path);
		const exists2 = await fileExists(uploaded2.path);
		const exists3 = await fileExists(uploaded3.path);
		expect(exists1).toBe(false);
		expect(exists2).toBe(false);
		expect(exists3).toBe(false);
	});

	it("サブディレクトリ内の画像も削除できる", async () => {
		const uploaded = await uploadTestImage(
			"deep/nested/path/image.png",
			"image.png",
		);

		const res = await app.request(
			`/api/images/${encodeURIComponent(uploaded.path)}`,
			{
				method: "DELETE",
			},
		);

		expect(res.status).toBe(204);

		const exists = await fileExists(uploaded.path);
		expect(exists).toBe(false);
	});
});
