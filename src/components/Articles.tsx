import { articles, formatDate, getArticle } from "../content/articles";
import { ArticleNotes } from "./ArticleNotes";

function Brand() {
	return (
		<a href="#/" className="logo article-brand">
			<div className="logo-icon">
				<svg className="logo-mark" viewBox="9 9 46 46" role="img" aria-label="Ratio·9">
					<rect x="9" y="30.4" width="12.1" height="24.6" rx="3.9" fill="#4CC9F0" />
					<rect x="25.9" y="21.6" width="12.1" height="33.4" rx="3.9" fill="#F5A524" />
					<rect x="42.9" y="9" width="12.1" height="46" rx="3.9" fill="#FFC15E" />
				</svg>
			</div>
			<div>
				<div className="logo-name">
					Ratio<span style={{ color: "var(--accent)" }}>·</span>9
				</div>
				<div className="logo-sub">Guitar speed trainer</div>
			</div>
		</a>
	);
}

export function ArticleList() {
	return (
		<div className="article-page">
			<header className="app-header">
				<Brand />
				<a href="#/" className="article-back">
					Back to trainer
				</a>
			</header>

			<div className="article-intro">
				<h1 className="article-list-title">Field manual</h1>
				<p className="article-list-sub">
					Why this thing exists, and what the evidence actually says about
					building speed.
				</p>
			</div>

			<div className="article-grid">
				{articles.map((a) => (
					<a key={a.slug} href={`#/articles/${a.slug}`} className="article-card">
						<div className="article-card-meta">
							<span>{formatDate(a.date)}</span>
							<span className="article-dot">·</span>
							<span>{a.readingMinutes} min read</span>
						</div>
						<h2 className="article-card-title">{a.title}</h2>
						<p className="article-card-summary">{a.summary}</p>
						<div className="article-tags">
							{a.tags.map((t) => (
								<span key={t} className="article-tag">
									{t}
								</span>
							))}
						</div>
					</a>
				))}
			</div>
		</div>
	);
}

export function ArticleView({ slug }: { slug: string }) {
	const article = getArticle(slug);

	if (!article) {
		return (
			<div className="article-page">
				<header className="app-header">
					<Brand />
					<a href="#/articles" className="article-back">
						All writing
					</a>
				</header>
				<div className="article-intro">
					<h1 className="article-list-title">Not found</h1>
					<p className="article-list-sub">
						No article called “{slug}”. <a href="#/articles">See what there is.</a>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="article-page">
			<header className="app-header">
				<Brand />
				<a href="#/articles" className="article-back">
					Field manual
				</a>
			</header>

			<article className="article-body">
				<div className="article-card-meta">
					<span>{formatDate(article.date)}</span>
					<span className="article-dot">·</span>
					<span>{article.readingMinutes} min read</span>
				</div>
				<h1 className="article-title">{article.title}</h1>
				<p className="article-lede">{article.summary}</p>
				<div
					className="article-prose"
					// Content is authored in this repo and every article string is
					// HTML-escaped by the renderer before any markup is produced.
					dangerouslySetInnerHTML={{ __html: article.html }}
				/>

				<ArticleNotes />
			</article>

			<div className="article-foot">
				<a href="#/articles" className="article-back">
					Field manual
				</a>
				<a href="#/" className="article-back">
					Open the trainer
				</a>
			</div>
		</div>
	);
}
