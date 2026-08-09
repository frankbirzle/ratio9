import { describe, expect, it } from "vitest";
import {
	parseArticle,
	parseFrontmatter,
	renderInline,
	renderMarkdown,
} from "../markdown";

describe("renderInline", () => {
	it("renders bold, italic and inline code", () => {
		expect(renderInline("a **b** c *d* e `f`")).toBe(
			"a <strong>b</strong> c <em>d</em> e <code>f</code>",
		);
	});

	it("leaves numbers in prose alone", () => {
		expect(renderInline("play 5 to 7 notes")).toBe("play 5 to 7 notes");
	});

	it("does not format inside inline code", () => {
		expect(renderInline("`a **b** c`")).toBe("<code>a **b** c</code>");
	});

	it("marks external links as noopener but leaves internal ones bare", () => {
		expect(renderInline("[x](https://e.com)")).toContain('rel="noopener noreferrer"');
		expect(renderInline("[x](#/articles/y)")).toBe('<a href="#/articles/y">x</a>');
	});
});

describe("renderMarkdown", () => {
	it("escapes HTML in article text", () => {
		expect(renderMarkdown("<script>alert(1)</script>")).toBe(
			"<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
		);
	});

	it("renders headings with slug ids", () => {
		expect(renderMarkdown("## The edge of ability")).toBe(
			'<h2 id="the-edge-of-ability">The edge of ability</h2>',
		);
	});

	it("joins wrapped lines into one paragraph", () => {
		expect(renderMarkdown("one\ntwo\n\nthree")).toBe(
			"<p>one two</p>\n<p>three</p>",
		);
	});

	it("renders both list kinds", () => {
		expect(renderMarkdown("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
		expect(renderMarkdown("1. a\n2. b")).toBe("<ol><li>a</li><li>b</li></ol>");
	});

	it("renders fenced code without formatting its contents", () => {
		expect(renderMarkdown("```ts\nconst a = **b**;\n```")).toBe(
			'<pre><code class="language-ts">const a = **b**;</code></pre>',
		);
	});

	it("renders blockquotes and rules", () => {
		expect(renderMarkdown("> quoted")).toBe(
			"<blockquote><p>quoted</p></blockquote>",
		);
		expect(renderMarkdown("---")).toBe("<hr />");
	});

	it("renders tables", () => {
		const html = renderMarkdown("| a | b |\n| --- | --- |\n| 1 | 2 |");
		expect(html).toContain("<th>a</th>");
		expect(html).toContain("<td>2</td>");
	});
});

describe("parseFrontmatter", () => {
	it("splits keys from the body", () => {
		const { data, body } = parseFrontmatter(
			'---\ntitle: "A title"\ndate: 2026-08-09\n---\nBody text\n',
		);
		expect(data.title).toBe("A title");
		expect(data.date).toBe("2026-08-09");
		expect(body.trim()).toBe("Body text");
	});

	it("passes through a document with no frontmatter", () => {
		expect(parseFrontmatter("# Hi").body).toBe("# Hi");
	});
});

describe("parseArticle", () => {
	it("derives reading time and tags", () => {
		const a = parseArticle(
			"x",
			`---\ntitle: T\ndate: 2026-01-01\nsummary: S\ntags: a, b\n---\n${"word ".repeat(440)}`,
		);
		expect(a.slug).toBe("x");
		expect(a.tags).toEqual(["a", "b"]);
		expect(a.readingMinutes).toBe(2);
		expect(a.html).toContain("<p>");
	});
});
