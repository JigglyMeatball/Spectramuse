# SpectraMuse

**Where stories become color, sound, and motion.**

SpectraMuse is a static browser app and living story engine for sensory storytelling. It turns typed stories into animated color, texture, motion, and generated sound. Creators can preview a story, record story or scene videos, save visual cards, copy captions, and download story text.

## Files

- `index.html` - the complete browser app.
- `scripts/build-static.mjs` - builds the deployable `dist/` folder.
- `scripts/export-story-smoke.mjs` - runs browser-based video export smoke tests.
- `wrangler.jsonc` - Cloudflare Workers Static Assets configuration.
- `_headers` and `robots.txt` - static site metadata copied into `dist/`.
- `CNAME` - custom domain marker for `spectramuse.com`.

## Local Commands

```sh
npm run build
npm run test:export
```

`npm run build` writes the static deploy artifact to `dist/`. `npm run test:export` rebuilds the site and verifies the story export flow in a local browser.

## Video Export

SpectraMuse chooses the best recording format supported by the browser. When MP4 recording is supported, story and scene filenames use:

- `spectramuse-story.mp4`
- `spectramuse-scene.mp4`

When MP4 is not supported, the app saves the same exports with a `.webm` fallback.

## Cloudflare Deployment

The current deploy target is Cloudflare Workers Static Assets through `wrangler.jsonc`.

```sh
npm run deploy:wrangler
```

Do not deploy until the intended changes have been reviewed and approved.

## Notes

- Browsers usually require a user click before audio playback or recording can start.
- The public site is `https://spectramuse.com`.
- The public contact address is `hello@spectramuse.com`.
