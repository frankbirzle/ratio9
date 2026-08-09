import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { prerenderArticles } from "./prerender.ts";

export default defineConfig({
	plugins: [
		react(),
		prerenderArticles(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Ratio·9 — Guitar Speed Trainer",
				short_name: "Ratio·9",
				description:
					"Metronome, speed trainer and dual-loop ratio trainer for guitar.",
				start_url: "/",
				theme_color: "#08090B",
				background_color: "#08090B",
				display: "standalone",
				icons: [
					{ src: "/favicons/icon-192.png", sizes: "192x192", type: "image/png" },
					{ src: "/favicons/icon-512.png", sizes: "512x512", type: "image/png" },
					{
						src: "/favicons/icon-maskable-512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
					{ src: "/favicons/favicon.svg", sizes: "any", type: "image/svg+xml" },
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,wav}"],
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
				// The article URLs are real pre-rendered files, so the navigation
				// fallback must not answer them with the app shell.
				navigateFallbackDenylist: [/^\/articles(\/|$)/],
			},
		}),
	],
});
