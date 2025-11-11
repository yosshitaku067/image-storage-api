import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { config } from "./config";
import imagesRoute from "./routes/images";

const app = new OpenAPIHono();

app.get("/", (c) => {
	return c.json({
		message: "Image Storage API",
		version: "1.0.0",
		endpoints: {
			docs: "/docs",
			api: "/api",
		},
	});
});

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

app.get("/docs", swaggerUI({ url: "/api/openapi.json" }));

console.log(`Image storage path: ${config.imageStoragePath}`);

serve(
	{
		fetch: app.fetch,
		port: config.port,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
		console.log(`Swagger UI: http://localhost:${info.port}/docs`);
	},
);
