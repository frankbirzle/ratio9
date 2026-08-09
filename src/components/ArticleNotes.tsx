// Single source of truth for the public contact address. Point this at a
// Cloudflare Email Routing alias, so it can be burned and replaced if it
// ever gets harvested, without exposing a real mailbox.
export const CONTACT_EMAIL = "ratio9@frankbirzle.de";

/**
 * Standing notes shown at the foot of every article. Kept here rather than in
 * the markdown so the wording lives in one place and every future post
 * inherits it.
 */
export function ArticleNotes() {
	return (
		<aside className="article-notes">
			<section className="article-note">
				<span className="article-note-label">On how this was written</span>
				<p>
					These articles are drafted largely with agentic LLM tooling. The
					facts, sources and claims in them are researched and compiled by hand.
				</p>
			</section>

			<section className="article-note">
				<span className="article-note-label">On sources and copyright</span>
				<p>
					This writing draws on other people's videos, articles and books, and I
					have tried to credit and link everyone I learned from. If something
					here is yours and you would rather it were not,{" "}
					<a href={`mailto:${CONTACT_EMAIL}`}>get in touch</a> and I will remove
					or change it. Ratio·9 is a non-commercial project: nothing to buy, no
					advertising, and no plan to monetise it.
				</p>
			</section>
		</aside>
	);
}
