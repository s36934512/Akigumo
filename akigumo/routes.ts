import type { HttpBindings } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

import { sseHandler } from "./delivery/sse/sse.handler.js";
import { tusServer } from "./delivery/tus/index.js";
import {
	handleArchiveConcept,
	handleArchiveDelete,
	handleArchiveUpload,
	handleBrowse,
} from "./modules/archive/index.js";
import { handleOntologyAttacher } from "./modules/ontology/attacher/index.js";
import {
	handleOntologyDelete,
	handleOntologyEditor,
	handleOntologyRegistry,
	handleOntologyResolver,
} from "./modules/ontology/index.js";

import {
	handleArchiveServe,
	handleSystemSearch,
} from "./modules/system/index.js";
import { handleUserRegistration } from "./modules/user/index.js";

const app = new OpenAPIHono<{ Bindings: HttpBindings }>().basePath("/api/v1");

app.use("*", logger());

app.get("/ui", swaggerUI({ url: "/api/v1/doc" }));
app.doc("/doc", {
	// Expose the OpenAPI JSON document
	openapi: "3.1.0",
	info: { title: "My API", version: "1.0.0" },
});

app.all("/tus/files/:fileId?", async (c) => {
	const method = c.req.method;
	let targetId = c.req.param("fileId");

	if (method === "POST") {
		// 從 Metadata Header 抓出 ID (Base64 解碼)
		const metadata = c.req.header("upload-metadata") || "";
		const match = metadata.match(/fileId\s+([^,]+)/);
		if (match) targetId = atob(match[1]);
	}

	console.log(`[Tus] ${method} Target ID: ${targetId || "New"}`);
	return await tusServer.handleWeb(c.req.raw);
});

app.route("/", sseHandler);

app.route("/", handleArchiveUpload);
app.route("/", handleArchiveDelete);
app.route("/", handleBrowse);

app.route("/", handleArchiveConcept);

app.route("/", handleOntologyAttacher);
app.route("/", handleOntologyDelete);
app.route("/", handleOntologyEditor);
app.route("/", handleOntologyRegistry);
app.route("/", handleOntologyResolver);

app.route("/", handleSystemSearch);
app.route("/", handleArchiveServe);

app.route("/", handleUserRegistration);

export default app;
