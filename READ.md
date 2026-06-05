# Chromatype

**A Synesthetic Typewriter for living stories.**

Chromatype is a static browser app that turns typed stories into animated color, texture, motion, and generated sound. Creators can perform a story, record it as a `.webm` video, save visual cards, and copy social-ready captions.

## Files

- `index.html` — the complete app.
- No build step required.
- No server required.
- No external dependencies.

## Fastest deployment

### Netlify Drop
1. Unzip this folder.
2. Drag the folder into Netlify Drop.
3. Netlify publishes the site and gives you a live URL.

## Other deployment options

### GitHub Pages
1. Create a GitHub repository.
2. Upload `index.html` to the repository root.
3. Enable GitHub Pages from the repository settings.

### Cloudflare Pages
1. Create a new Pages project.
2. Upload this static folder or connect a GitHub repository.
3. Build command: none.
4. Output directory: project root.

### Vercel
1. Import a repository containing this folder.
2. Framework preset: Other/static.
3. Build command: none.
4. Output directory: project root.

## Notes

- Video recording exports `.webm`.
- Some social platforms may prefer MP4, so creators may need to convert WebM to MP4 before uploading.
- Browsers usually require a user click before audio recording works. Use the app buttons rather than autoplay.
