import { CONTACT_EMAIL } from "./ArticleNotes";

// ---------------------------------------------------------------------------
// FILL THESE IN. German law (§5 DDG) requires a real name and a postal address
// a letter can actually reach — a P.O. box is not sufficient.
// ---------------------------------------------------------------------------
const OWNER = {
	name: "TODO: Full legal name",
	street: "TODO: Street and number",
	city: "TODO: Postcode and city",
	country: "Germany",
};

export function Legal() {
	return (
		<div className="article-page">
			<header className="app-header">
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
				<a href="#/" className="article-back">
					Back to trainer
				</a>
			</header>

			<article className="article-body">
				<h1 className="article-title">Imprint &amp; privacy</h1>
				<p className="article-lede">
					Ratio·9 is a private, non-commercial project. Nothing is sold here,
					there is no advertising, and no analytics of any kind.
				</p>

				<div className="article-prose">
					<h2 id="imprint">Imprint (Impressum)</h2>
					<p>Information according to §5 DDG:</p>
					<p>
						{OWNER.name}
						<br />
						{OWNER.street}
						<br />
						{OWNER.city}
						<br />
						{OWNER.country}
					</p>
					<p>
						Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
					</p>
					<p>Responsible for the content of this site: {OWNER.name}.</p>

					<h2 id="privacy">Privacy</h2>
					<p>
						The controller for data processing on this site is the person named
						above, reachable at the address and email given.
					</p>

					<h3>What stays on your device</h3>
					<p>
						Your settings and saved presets are stored in your browser's local
						storage. They never leave your device and are never transmitted
						anywhere. Clearing your browser data deletes them.
					</p>
					<p>
						This site sets <strong>no cookies</strong>, runs no analytics, no
						tracking pixels, and no advertising.
					</p>

					<h3>Hosting</h3>
					<p>
						The site is hosted by Cloudflare, Inc. When you visit, Cloudflare
						processes technical data required to deliver the page, including
						your IP address, the time of the request, the page requested, and
						your browser's user agent. This happens on the legal basis of a
						legitimate interest in operating and securing the site (Art. 6(1)(f)
						GDPR). Cloudflare acts as a processor under a data processing
						agreement.
					</p>

					<h3>Fonts</h3>
					<p>
						Fonts are served from this site's own domain. No font, script or
						other asset is loaded from a third-party server, so no request from
						your browser goes anywhere except this site and its host.
					</p>

					<h3>Contact by email</h3>
					<p>
						If you write to the address above, your message and email address
						are processed solely to answer you, and kept only as long as needed
						for that.
					</p>

					<h3>Your rights</h3>
					<p>
						You have the right to access, rectification, erasure, restriction of
						processing, and data portability regarding your personal data, and
						the right to object to processing based on legitimate interests.
						Write to the address above to exercise any of these. You also have
						the right to lodge a complaint with a data protection supervisory
						authority.
					</p>

					<h2 id="content">Liability for content and links</h2>
					<p>
						This site links to external websites over whose content I have no
						control, and I accept no responsibility for it. Responsibility for
						linked content lies with its respective operators. If you become
						aware of a legal violation on a linked page, please tell me and I
						will remove the link.
					</p>
					<p>
						The practice material here is written to the best of my knowledge
						and is not medical advice. Playing an instrument carries a risk of
						strain injury. Stop if something hurts, and see a professional
						rather than pushing through.
					</p>

					<h2 id="licence">Licence</h2>
					<p>
						The source code is published under the MIT licence and available on{" "}
						<a
							href="https://github.com/frankbirzle/ratio9"
							target="_blank"
							rel="noopener noreferrer"
						>
							GitHub
						</a>
						. If material of yours appears on this site and you would rather it
						did not, <a href={`mailto:${CONTACT_EMAIL}`}>get in touch</a> and I
						will remove it.
					</p>
				</div>
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
