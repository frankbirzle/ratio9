/**
 * Minimal Markdown to HTML renderer.
 *
 * Deliberately small: the app ships with no runtime dependencies beyond React,
 * and articles only need the subset below. Everything is escaped before any
 * markup is generated, so article text can never inject HTML.
 *
 * Supported: headings, paragraphs, unordered/ordered lists, blockquotes,
 * fenced code blocks, horizontal rules, tables, bold, italic, inline code,
 * links, and images.
 */

export interface Frontmatter {
	title: string;
	date: string;
	summary: string;
	tags: string[];
	readingMinutes: number;
}

export interface Article extends Frontmatter {
	slug: string;
	html: string;
	wordCount: number;
}

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** Inline formatting. Runs on already-escaped text. */
export function renderInline(text: string): string {
	// Inline code is pulled out first so the other rules cannot touch its
	// contents. The placeholder is a private-use character, which cannot occur
	// in prose; a bare " 3 " marker would match any number in a sentence.
	const codeSpans: string[] = [];
	let out = text.replace(/`([^`]+)`/g, (_m, code: string) => {
		codeSpans.push(code);
		return `\uE000${codeSpans.length - 1}\uE001`;
	});

	out = out
		.replace(
			/!\[([^\]]*)\]\(([^)\s]+)\)/g,
			(_m, alt: string, src: string) =>
				`<img src="${src}" alt="${alt}" loading="lazy" />`,
		)
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
			const external = /^https?:\/\//.test(href);
			const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
			return `<a href="${href}"${attrs}>${label}</a>`;
		})
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

	return out.replace(
		/\uE000(\d+)\uE001/g,
		(_m, i: string) => `<code>${codeSpans[Number(i)]}</code>`,
	);
}

/** Split `---` frontmatter from the body. */
export function parseFrontmatter(src: string): {
	data: Record<string, string>;
	body: string;
} {
	const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
	if (!match) return { data: {}, body: src };

	const data: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
		if (!kv) continue;
		data[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
	}
	return { data, body: src.slice(match[0].length) };
}

export function renderMarkdown(src: string): string {
	const lines = src.replace(/\r\n/g, "\n").split("\n");
	const out: string[] = [];
	let i = 0;

	const flushParagraph = (buf: string[]) => {
		if (buf.length) out.push(`<p>${renderInline(escapeHtml(buf.join(" ")))}</p>`);
		buf.length = 0;
	};
	const para: string[] = [];

	while (i < lines.length) {
		const line = lines[i];

		// Fenced code block
		const fence = /^```(\w*)\s*$/.exec(line);
		if (fence) {
			flushParagraph(para);
			const lang = fence[1];
			const code: string[] = [];
			i++;
			while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
			i++; // closing fence
			const cls = lang ? ` class="language-${lang}"` : "";
			out.push(`<pre><code${cls}>${escapeHtml(code.join("\n"))}</code></pre>`);
			continue;
		}

		// Heading
		const heading = /^(#{1,4})\s+(.*)$/.exec(line);
		if (heading) {
			flushParagraph(para);
			const level = heading[1].length;
			const text = renderInline(escapeHtml(heading[2]));
			const id = heading[2]
				.toLowerCase()
				.replace(/[^\w\s-]/g, "")
				.trim()
				.replace(/\s+/g, "-");
			out.push(`<h${level} id="${id}">${text}</h${level}>`);
			i++;
			continue;
		}

		// Horizontal rule
		if (/^(---|\*\*\*|___)\s*$/.test(line)) {
			flushParagraph(para);
			out.push("<hr />");
			i++;
			continue;
		}

		// Blockquote
		if (/^>\s?/.test(line)) {
			flushParagraph(para);
			const quote: string[] = [];
			while (i < lines.length && /^>\s?/.test(lines[i])) {
				quote.push(lines[i].replace(/^>\s?/, ""));
				i++;
			}
			out.push(`<blockquote>${renderMarkdown(quote.join("\n"))}</blockquote>`);
			continue;
		}

		// Table
		if (/^\|.*\|\s*$/.test(line) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? "")) {
			flushParagraph(para);
			const cells = (row: string) =>
				row
					.trim()
					.replace(/^\||\|$/g, "")
					.split("|")
					.map((c) => renderInline(escapeHtml(c.trim())));
			const head = cells(line);
			i += 2;
			const body: string[][] = [];
			while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
				body.push(cells(lines[i]));
				i++;
			}
			out.push(
				`<table><thead><tr>${head.map((c) => `<th>${c}</th>`).join("")}</tr></thead>` +
					`<tbody>${body
						.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
						.join("")}</tbody></table>`,
			);
			continue;
		}

		// Lists
		const bullet = /^[-*]\s+(.*)$/.exec(line);
		const ordered = /^\d+\.\s+(.*)$/.exec(line);
		if (bullet || ordered) {
			flushParagraph(para);
			const tag = bullet ? "ul" : "ol";
			const pattern = bullet ? /^[-*]\s+(.*)$/ : /^\d+\.\s+(.*)$/;
			const items: string[] = [];
			while (i < lines.length) {
				const m = pattern.exec(lines[i]);
				if (m) {
					items.push(m[1]);
					i++;
				} else if (/^\s{2,}\S/.test(lines[i]) && items.length) {
					// continuation line of the previous item
					items[items.length - 1] += ` ${lines[i].trim()}`;
					i++;
				} else break;
			}
			out.push(
				`<${tag}>${items
					.map((t) => `<li>${renderInline(escapeHtml(t))}</li>`)
					.join("")}</${tag}>`,
			);
			continue;
		}

		// Blank line ends a paragraph
		if (!line.trim()) {
			flushParagraph(para);
			i++;
			continue;
		}

		para.push(line.trim());
		i++;
	}
	flushParagraph(para);
	return out.join("\n");
}

export function parseArticle(slug: string, src: string): Article {
	const { data, body } = parseFrontmatter(src);
	const wordCount = body.split(/\s+/).filter(Boolean).length;
	return {
		slug,
		title: data.title ?? slug,
		date: data.date ?? "",
		summary: data.summary ?? "",
		tags: data.tags ? data.tags.split(",").map((t) => t.trim()) : [],
		readingMinutes: Math.max(1, Math.round(wordCount / 220)),
		wordCount,
		html: renderMarkdown(body),
	};
}
