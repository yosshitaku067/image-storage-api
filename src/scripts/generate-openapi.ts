import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { OpenAPIHono } from "@hono/zod-openapi";
import yaml from "js-yaml";
import imagesRoute from "../routes/images";

const generateOpenAPISpec = () => {
	const app = new OpenAPIHono();

	app.route("/api/images", imagesRoute);

	app.doc("/api/openapi.json", {
		openapi: "3.1.0",
		info: {
			title: "Image Storage API",
			version: "1.0.0",
			description: "ローカルストレージに画像を保存・取得するためのAPI",
		},
		tags: [
			{
				name: "Images",
				description: "画像の管理",
			},
		],
	});

	const openapiSpec = app.getOpenAPI31Document({
		openapi: "3.1.0",
		info: {
			title: "Image Storage API",
			version: "1.0.0",
			description: "ローカルストレージに画像を保存・取得するためのAPI",
		},
		tags: [
			{
				name: "Images",
				description: "画像の管理",
			},
		],
	});

	return openapiSpec;
};

const main = async () => {
	try {
		console.log("OpenAPI仕様を生成中...");

		const spec = generateOpenAPISpec();

		const yamlContent = yaml.dump(spec, {
			indent: 2,
			lineWidth: 120,
			noRefs: false,
		});

		const outputPath = resolve(process.cwd(), "openapi.yaml");
		await writeFile(outputPath, yamlContent, "utf-8");

		console.log(`✓ OpenAPI仕様をYAML形式で出力しました: ${outputPath}`);

		const jsonOutputPath = resolve(process.cwd(), "openapi.json");
		await writeFile(jsonOutputPath, JSON.stringify(spec, null, 2), "utf-8");

		console.log(`✓ OpenAPI仕様をJSON形式で出力しました: ${jsonOutputPath}`);
	} catch (error) {
		console.error("エラー:", error);
		process.exit(1);
	}
};

main();
