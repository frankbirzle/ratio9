import { parseArticle, type Article } from "./markdown";

/**
 * Every .md file in ./articles becomes a post. To add one, drop a file in
 * that folder with frontmatter (title, date, summary, tags) — no registration
 * step, no build config. The filename is the URL slug.
 */
const files = import.meta.glob("./articles/*.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

export const articles: Article[] = Object.entries(files)
	.map(([path, src]) =>
		parseArticle(path.replace(/^.*\/(.+)\.md$/, "$1"), src),
	)
	.sort((a, b) => b.date.localeCompare(a.date));

export function getArticle(slug: string): Article | undefined {
	return articles.find((a) => a.slug === slug);
}

export function formatDate(iso: string): string {
	if (!iso) return "";
	const d = new Date(`${iso}T00:00:00`);
	return Number.isNaN(d.getTime())
		? iso
		: d.toLocaleDateString("en-GB", {
				day: "numeric",
				month: "short",
				year: "numeric",
			});
}
