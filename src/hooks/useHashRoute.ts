import { useEffect, useState } from "react";

export type Route =
	| { name: "app" }
	| { name: "articles" }
	| { name: "article"; slug: string };

export function parseHash(hash: string): Route {
	const path = hash.replace(/^#\/?/, "");
	if (path === "articles") return { name: "articles" };
	const article = /^articles\/(.+)$/.exec(path);
	if (article) return { name: "article", slug: article[1] };
	return { name: "app" };
}

/**
 * Hash routing rather than a router dependency: this is a static SPA, and
 * hash URLs work on any host with no server rewrite rules.
 */
export function useHashRoute(): Route {
	const [route, setRoute] = useState<Route>(() =>
		parseHash(window.location.hash),
	);

	useEffect(() => {
		const onChange = () => {
			setRoute(parseHash(window.location.hash));
			window.scrollTo(0, 0);
		};
		window.addEventListener("hashchange", onChange);
		return () => window.removeEventListener("hashchange", onChange);
	}, []);

	return route;
}
