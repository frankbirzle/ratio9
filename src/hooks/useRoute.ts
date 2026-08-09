import { useEffect, useState } from "react";

export type Route =
	| { name: "app" }
	| { name: "articles" }
	| { name: "article"; slug: string }
	| { name: "legal" };

/** Fired by navigate(). popstate does not fire for our own pushState calls. */
const ROUTE_EVENT = "ratio9:route";

/**
 * The path is the route. Articles are documents, so they get real URLs that a
 * crawler can fetch and the build can pre-render; `#/articles/foo` links from
 * before still resolve, so nothing that was shared stays broken.
 */
export function parseRoute(pathname: string, hash: string): Route {
	const fromPath = matchPath(pathname);
	if (fromPath) return fromPath;

	// Legacy hash URLs. `#/articles/foo` becomes `/articles/foo`.
	const legacy = matchPath(`/${hash.replace(/^#\/?/, "")}`);
	return legacy ?? { name: "app" };
}

function matchPath(pathname: string): Route | null {
	const path = pathname.replace(/\/+$/, "").replace(/^\/+/, "");
	if (path === "articles") return { name: "articles" };
	if (path === "legal" || path === "imprint") return { name: "legal" };

	const article = /^articles\/(.+)$/.exec(path);
	if (article) return { name: "article", slug: article[1] };

	return null;
}

/** Client-side navigation. Falls back to a normal load if history is absent. */
export function navigate(path: string) {
	window.history.pushState(null, "", path);
	window.dispatchEvent(new Event(ROUTE_EVENT));
}

/**
 * Turns plain left-clicks on same-origin links into client navigation, so the
 * anchors stay real `href`s that crawlers follow and middle-click still opens
 * a tab. Anything with a modifier, a target, or a foreign origin is left alone.
 */
function interceptLinks(event: MouseEvent) {
	if (event.defaultPrevented || event.button !== 0) return;
	if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

	const anchor = (event.target as Element | null)?.closest?.("a");
	if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

	const href = anchor.getAttribute("href");
	if (!href || !href.startsWith("/")) return;

	event.preventDefault();
	navigate(href);
}

export function useRoute(): Route {
	const [route, setRoute] = useState<Route>(() =>
		parseRoute(window.location.pathname, window.location.hash),
	);

	useEffect(() => {
		const onChange = () => {
			setRoute(parseRoute(window.location.pathname, window.location.hash));
			window.scrollTo(0, 0);
		};

		window.addEventListener("popstate", onChange);
		window.addEventListener("hashchange", onChange);
		window.addEventListener(ROUTE_EVENT, onChange);
		document.addEventListener("click", interceptLinks);

		return () => {
			window.removeEventListener("popstate", onChange);
			window.removeEventListener("hashchange", onChange);
			window.removeEventListener(ROUTE_EVENT, onChange);
			document.removeEventListener("click", interceptLinks);
		};
	}, []);

	return route;
}
