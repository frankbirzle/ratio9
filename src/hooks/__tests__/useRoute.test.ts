import { describe, expect, it } from "vitest";
import { parseRoute } from "../useRoute";

describe("parseRoute", () => {
	it("treats the root as the trainer", () => {
		expect(parseRoute("/", "")).toEqual({ name: "app" });
	});

	it("reads the article list and a single article from the path", () => {
		expect(parseRoute("/articles", "")).toEqual({ name: "articles" });
		expect(parseRoute("/articles/the-three-zones", "")).toEqual({
			name: "article",
			slug: "the-three-zones",
		});
	});

	it("ignores a trailing slash, which is how the pre-rendered files are served", () => {
		expect(parseRoute("/articles/", "")).toEqual({ name: "articles" });
		expect(parseRoute("/articles/the-three-zones/", "")).toEqual({
			name: "article",
			slug: "the-three-zones",
		});
	});

	it("keeps the legal page on both of its names", () => {
		expect(parseRoute("/legal", "")).toEqual({ name: "legal" });
		expect(parseRoute("/imprint", "")).toEqual({ name: "legal" });
	});

	it("still resolves the hash URLs that were shared before", () => {
		expect(parseRoute("/", "#/articles")).toEqual({ name: "articles" });
		expect(parseRoute("/", "#/articles/the-myelin-story")).toEqual({
			name: "article",
			slug: "the-myelin-story",
		});
		expect(parseRoute("/", "#/legal")).toEqual({ name: "legal" });
	});

	it("prefers the path when both are present", () => {
		expect(parseRoute("/articles/a", "#/legal")).toEqual({
			name: "article",
			slug: "a",
		});
	});

	it("falls back to the trainer for anything unknown", () => {
		expect(parseRoute("/nope", "")).toEqual({ name: "app" });
		expect(parseRoute("/", "#/nope")).toEqual({ name: "app" });
	});
});
