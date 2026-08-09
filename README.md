# Ratio·9 — Guitar Speed Trainer

A dual-loop subdivision ratio metronome for guitarists who want to build speed systematically.

**Live:** [ratio9.app](https://ratio9.app) (TODO: update URL)

## Why

<!-- TODO: Fill in your story — why you built this, what problem it solves for you -->

## Features

- **Dual-Loop Ratio Training** — Alternate between two subdivisions (e.g. 8th triplets → sextuplets) at the same BPM. The subdivision ratio forces you to double your picking speed while the beat stays constant.
- **Progressive Tempo** — BPM ramps automatically after N bars. Four curves: linear, logarithmic, stepback, pyramid.
- **Metronome Mode** — Standard click with 8 subdivisions, 7 time signatures, accent grouping.
- **8 Sound Engines** — Warm woodblock, sharp clave, cowbell, soft chime, digital beep, rim shot, tabla, analog click. All synthesized locally — no samples needed (rim shot & tabla are CC0 samples).
- **Presets** — Save and load named configurations (localStorage).
- **Countdown Timer** — Set a practice duration and get notified when time's up.
- **Keyboard Shortcuts** — Space (start/stop), 1/2/3 (modes), T (tap tempo), arrows (BPM), S (setup).
- **PWA** — Install as a standalone app on desktop and mobile.
- **Dark UI** — Amber-on-dark design with reduced-motion support.

## Getting Started

```bash
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build
npm test         # run tests
```

## Contributing

Issues and PRs welcome. Run `npm test` before submitting — the test suite covers the audio scheduler, accent logic, and tempo calculations.

## License

MIT — see [LICENSE](./LICENSE).
