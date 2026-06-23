# SpectraMuse

Where stories become color, sound, and motion. A living story engine for sensory storytelling. SpectraMuse turns written stories into moving color, texture, and sound, then lets creators record and share the result.

## Hosting

This repo is configured as a static Cloudflare Workers site through `wrangler.toml`.

### Cloudflare build settings

Use these settings if connecting the repo through Cloudflare:

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `/`

### Manual deployment

```bash
npm install
npm run build
npm run deploy:wrangler
```

The build script copies `index.html` and supported static asset folders into `dist/`, then Wrangler deploys that directory as static assets.
