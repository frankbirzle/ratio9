import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { Plugin } from "vite";
import { parseArticle, type Article } from "./src/content/markdown.ts";

const SITE = "https://ratio9.frankbirzle.de";
const ARTICLE_DIR = "src/content/articles";

/**
 * The app is client-rendered, so a crawler that does not run JavaScript sees an
 * empty page. The articles are documents rather than app state, so after the
 * bundle is written this emits a real HTML file per article: full text in the
 * markup, its own title and description, and Article structured data.
 *
 * React still owns the page once it boots — it renders the same article over
 * the top from the same markdown. The pre-rendered copy is what crawlers read
 * and what shows during the first paint.
 */
export function prerenderArticles(): Plugin {
	return {
		name: "ratio9:prerender-articles",
		apply: "build",
		closeBundle() {
			const outDir = resolve("dist");
			const shell = readFileSync(join(outDir, "index.html"), "utf8");
			const assets = extractAssetTags(shell);
			const articles = loadArticles();

			for (const article of articles) {
				write(
					join(outDir, "articles", article.slug, "index.html"),
					articlePage(article, assets),
				);
			}
			write(join(outDir, "articles", "index.html"), listPage(articles, assets));
			write(join(outDir, "sitemap.xml"), sitemap(articles));

			this.info(`pre-rendered ${articles.length} articles + index + sitemap`);
		},
	};
}

function loadArticles(): Article[] {
	const dir = resolve(ARTICLE_DIR);
	return readdirSync(dir)
		.filter((f) => f.endsWith(".md"))
		.map((f) => parseArticle(f.replace(/\.md$/, ""), readFileSync(join(dir, f), "utf8")))
		.sort((a, b) => b.date.localeCompare(a.date));
}

function write(path: string, contents: string) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, contents);
}

/**
 * The built shell is the only place that knows the fingerprinted asset names,
 * so the tags are lifted from it rather than guessed.
 */
function extractAssetTags(shell: string): string {
	const tags = shell.match(
		/<script type="module"[^>]*><\/script>|<link rel="stylesheet"[^>]*>|<link rel="manifest"[^>]*>|<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/g,
	);
	if (!tags?.length) {
		throw new Error("prerender: found no asset tags in dist/index.html");
	}
	return tags.join("\n    ");
}

function attr(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
	if (!iso) return "";
	const d = new Date(`${iso}T00:00:00Z`);
	return Number.isNaN(d.getTime())
		? iso
		: d.toLocaleDateString("en-GB", {
				day: "numeric",
				month: "short",
				year: "numeric",
				timeZone: "UTC",
			});
}

interface PageParts {
	url: string;
	title: string;
	description: string;
	jsonLd: string;
	body: string;
	assets: string;
}

function document({ url, title, description, jsonLd, body, assets }: PageParts): string {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${attr(description)}" />
    <link rel="canonical" href="${attr(url)}" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${attr(url)}" />
    <meta property="og:image" content="${SITE}/favicons/icon-512.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${attr(title)}" />
    <meta name="twitter:description" content="${attr(description)}" />
    <link rel="icon" href="/favicons/favicon.ico" sizes="any" />
    <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicons/apple-touch-icon.png" />
    <meta name="theme-color" content="#08090B" />
    <link rel="preload" href="/fonts/space-grotesk-500-latin.woff2" as="font" type="font/woff2" crossorigin />
    <title>${attr(title)}</title>
    <script type="application/ld+json">
${jsonLd}
    </script>
    ${assets}
  </head>
  <body>
    <div id="root">${body}</div>
  </body>
</html>
`;
}

/** Reproduces the markup of ArticleView so the first paint is not a blank page. */
function articlePage(article: Article, assets: string): string {
	const url = `${SITE}/articles/${article.slug}`;

	const jsonLd = JSON.stringify(
		{
			"@context": "https://schema.org",
			"@type": "Article",
			headline: article.title,
			description: article.summary,
			datePublished: article.date,
			dateModified: article.date,
			wordCount: article.wordCount,
			keywords: article.tags.join(", "),
			inLanguage: "en",
			author: { "@type": "Person", name: "Frank Birzle" },
			publisher: { "@type": "Person", name: "Frank Birzle" },
			mainEntityOfPage: { "@type": "WebPage", "@id": url },
			isPartOf: {
				"@type": "Collection",
				name: "Ratio·9 field manual",
				url: `${SITE}/articles`,
			},
			about: {
				"@type": "SoftwareApplication",
				name: "Ratio·9",
				"@id": `${SITE}/#app`,
			},
		},
		null,
		2,
	);

	const body = `<div class="app-root"><div class="app-content"><div class="article-page">
      ${header("Field manual", "/articles")}
      <article class="article-body">
        <div class="article-card-meta"><span>${attr(formatDate(article.date))}</span><span class="article-dot">·</span><span>${article.readingMinutes} min read</span></div>
        <h1 class="article-title">${attr(article.title)}</h1>
        <p class="article-lede">${attr(article.summary)}</p>
        <div class="article-prose">${article.html}</div>
      </article>
    </div></div></div>`;

	return document({
		url,
		title: `${article.title} — Ratio·9`,
		description: article.summary,
		jsonLd,
		body,
		assets,
	});
}

function listPage(articles: Article[], assets: string): string {
	const url = `${SITE}/articles`;
	const description =
		"The Ratio·9 field manual: why subdivision ratio training builds guitar speed, what the evidence for practice folklore actually says, and the routine to follow.";

	const jsonLd = JSON.stringify(
		{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			name: "Ratio·9 field manual",
			description,
			url,
			inLanguage: "en",
			hasPart: articles.map((a) => ({
				"@type": "Article",
				headline: a.title,
				description: a.summary,
				datePublished: a.date,
				url: `${SITE}/articles/${a.slug}`,
			})),
		},
		null,
		2,
	);

	const cards = articles
		.map(
			(a) => `<a href="/articles/${a.slug}" class="article-card">
          <div class="article-card-meta"><span>${attr(formatDate(a.date))}</span><span class="article-dot">·</span><span>${a.readingMinutes} min read</span></div>
          <h2 class="article-card-title">${attr(a.title)}</h2>
          <p class="article-card-summary">${attr(a.summary)}</p>
          <div class="article-tags">${a.tags.map((t) => `<span class="article-tag">${attr(t)}</span>`).join("")}</div>
        </a>`,
		)
		.join("\n        ");

	const body = `<div class="app-root"><div class="app-content"><div class="article-page">
      ${header("Back to trainer", "/")}
      <div class="article-intro">
        <h1 class="article-list-title">Field manual</h1>
        <p class="article-list-sub">Why this thing exists, and what the evidence actually says about building speed.</p>
      </div>
      <div class="article-grid">
        ${cards}
      </div>
    </div></div></div>`;

	return document({
		url,
		title: "Field manual — Ratio·9",
		description,
		jsonLd,
		body,
		assets,
	});
}

function header(backLabel: string, backHref: string): string {
	return `<header class="app-header">
        <a href="/" class="logo article-brand">
          <div class="logo-icon">
            <svg class="logo-mark" viewBox="9 9 46 46" role="img" aria-label="Ratio·9">
              <rect x="9" y="30.4" width="12.1" height="24.6" rx="3.9" fill="#4CC9F0" />
              <rect x="25.9" y="21.6" width="12.1" height="33.4" rx="3.9" fill="#F5A524" />
              <rect x="42.9" y="9" width="12.1" height="46" rx="3.9" fill="#FFC15E" />
            </svg>
          </div>
          <div>
            <div class="logo-name">Ratio<span style="color: var(--accent)">·</span>9</div>
            <div class="logo-sub">Guitar speed trainer</div>
          </div>
        </a>
        <a href="${backHref}" class="article-back">${backLabel}</a>
      </header>`;
}

function sitemap(articles: Article[]): string {
	const newest = articles[0]?.date ?? "";
	const entry = (loc: string, lastmod: string, priority: string) =>
		`  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <priority>${priority}</priority>\n  </url>`;

	return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated at build time by prerender.ts. Do not edit by hand. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
	entry(`${SITE}/`, newest, "1.0"),
	entry(`${SITE}/articles`, newest, "0.8"),
	...articles.map((a) => entry(`${SITE}/articles/${a.slug}`, a.date, "0.7")),
].join("\n")}
</urlset>
`;
}
