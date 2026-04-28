# Deployment & Image Pipeline

Rules and best practices for shipping this Nuxt 4 static site to Firebase Hosting, plus the image-pipeline conventions that make caching work correctly.

## Pre-deploy checklist

Run through this list before every prod deploy.

1. **Regenerate images from clean state.** The image processor only adds files; it never removes orphans. Stale `.jpg`/`.png` files left behind from format changes will deploy as dead weight.
   ```
   rm -rf shared/images/processed && node scripts/process-images.js
   ```
2. **Decide on `X-Robots-Tag`.** `firebase.json` ships with `noindex, nofollow` so staging/preview deploys don't get indexed. Remove that header for the real prod launch — otherwise Google will not index the site.
3. **Build locally.** `bun run generate` — confirm no warnings about missing manifest entries or broken imports.
4. **Smoke-test the production headers.** Either `firebase emulators:start --only hosting` or `firebase hosting:channel:deploy <preview>`, then:
   ```
   curl -I https://<host>/images/processed/<hash>.webp
   curl -I https://<host>/
   ```
   Image must show `cache-control: public, max-age=31536000, immutable`. HTML must show `cache-control: public, max-age=0, must-revalidate`.
5. **Network panel sanity check** in an incognito window with DevTools open, "Disable cache" OFF:
   - Each unique image URL appears exactly once.
   - Second reload shows everything served from `(disk cache)`, transferred ≈ 0 B.
   - Total transfer on first visit is nowhere near 40 MB (we measured ~40 MB before the cache fix).
6. **Lighthouse mobile run.** LCP < 2.5 s. "Properly size images" / "Serve images in next-gen formats" should be clear.

## Local dev vs. production

| Concern | Local dev (`bun run dev`) | Production (`nuxt generate` → Firebase Hosting) |
|---|---|---|
| **Cache headers** | Vite dev server sets its own headers (no-cache for HMR) — `firebase.json` is irrelevant. | Firebase merges all matching `headers[]` globs from `firebase.json`. Hashed assets get `immutable`; HTML gets `must-revalidate`. |
| **Asset URLs** | `/images/processed/<hash>.webp` resolved from `shared/` via the Nitro `publicAssets` mapping. | Same path — files copied verbatim into `.output/public/` by `nuxt generate`. |
| **Image processing** | Manual: re-run `node scripts/process-images.js` whenever source images change. | The build assumes `app/image-manifest.json` is up to date and `shared/images/processed/` is populated. There is no build-time hook. |
| **Source-map / minify** | `nuxt.config.ts` sets `vite.build.minify: false` and `cssMinify: false` — kept off for now to make prod debugging easier. Flip to `true` when you want smaller bundles. | Same — currently not minified. |
| **Preloader behaviour** | Same as prod: walks `[data-pre]`, sets `el.src`, fires `preloader:done`. | Same. |
| **`<link rel="preload">` for LCP** | Emitted in dev too via `useHead` in `pages/index.vue`. Visible in dev devtools. | Static-rendered in HTML so the browser starts the fetch before any JS executes. |
| **Robots indexing** | N/A. | `X-Robots-Tag: noindex, nofollow` until the real launch — flip when ready. |
| **HSTS** | Do **not** enable locally — breaks plain-HTTP local serving. | Recommended once HTTPS-only is confirmed: `Strict-Transport-Security: max-age=31536000; includeSubDomains`. |

## `firebase.json` header strategy

Layered globs. **Do not collapse this back into a single `**` rule** — the `no-store` rule that lived there was the root cause of images being requested 2–3× per page view (see "Why" below).

```json
"headers": [
  { "source": "**/images/processed/**",  "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
  { "source": "**/_nuxt/**",             "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
  { "source": "**/*.@(woff|woff2|ttf|otf)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
  { "source": "**/*.html",               "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
  { "source": "**",                      "headers": [ /* security headers only */ ] }
]
```

### Why each rule

- **`/images/processed/**` and `/_nuxt/**` — `immutable`.** Both are content-addressed (md5 hash in filename, e.g. `05f9bac1.webp`, `entry.abc123.js`). Content change ⇒ new hash ⇒ new URL, so `immutable` for one year is always safe and the browser will never revalidate.
- **Fonts — `immutable`.** Versioned by their own filenames (we ship into `/fonts/`). Same reasoning.
- **`*.html` — `must-revalidate`, max-age=0.** HTML is the entry point that points at the hashed assets. It must always be re-checked so updates propagate immediately.
- **`**` for security headers only.** Firebase merges `headers[]` from every matching glob, so security headers apply to everything without conflicting with the cache rules above.

### Why the previous `**` cache rule was wrong

The original `firebase.json` had:

```
{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
```

`no-store` forbids the browser from caching the response **at all**, including the in-memory cache used to dedupe requests for the same URL within a single page. Effects we observed:

1. Same image referenced by two `<img>` tags = two network fetches.
2. Route navigation re-runs `AppPreloader.load()`, which re-assigns `el.src = url`. With `no-store`, that's a fresh network request instead of a memory-cache hit.
3. Reload / back-forward = full re-download of every asset.

Result: ~40 MB transferred on first home-page visit, with most images requested 2× and several 3×.

## Image pipeline (`scripts/process-images.js`)

### Pipeline rules

- **Output format is always WebP** (`quality: 80` desktop, `75` mobile). JPEG/PNG sources are normalised on the way through. SVG and MP4 pass through unchanged.
- **Two sizes per source.** Desktop ≤ 2560×1440, mobile ≤ 1280×720. Both via `fit: 'inside', withoutEnlargement: true` so aspect ratio is preserved and we never upscale.
- **Filename = MD5 of source content, sliced to 8 chars.** Stable hash means rebuilds don't churn URLs unless the source actually changed.
- **Width / height baked into manifest** so `<img>` can reserve layout space — prevents CLS that confuses ScrollTrigger.
- **Alt text lives in the `ALT_TEXT` map** at the top of `scripts/process-images.js`, keyed by relative path under `shared/images/`. Edit there, re-run the script, the manifest picks up the new strings.

### Component conventions

- **All raster images render as `<img :data-pre="...desktop" :data-pre-mobile="...mobile" :width :height :alt>`.** No `src` at SSR time. `AppPreloader` swaps in the correct URL on first paint based on `$device.isMobile`.
- **Decorative images** (background-only, no semantic meaning) get `alt=""` (e.g. `MapClients.vue` map backgrounds).
- **LCP image** (`Cover.vue`) gets `fetchpriority="high"` and a `<link rel="preload">` emitted from the page's `head()` for both desktop and mobile via `media` queries.
- **Adding a new image:**
  1. Drop the file into `shared/images/<subdir>/`.
  2. Add an entry to `ALT_TEXT` in `scripts/process-images.js` (or accept that decorative imgs won't have an alt key — bind `alt=""` manually).
  3. Run `node scripts/process-images.js`.
  4. Reference in a component as `images['filename.ext']` (or `images['subdir']['filename.ext']` via the nested manifest).

## Changes made (April 2026 deploy-readiness pass)

For reference when reviewing the diff or undoing any of this.

### `firebase.json`
- Replaced single `**` cache rule (`no-cache, no-store, must-revalidate`) with layered policy: `immutable` for `/images/processed/**`, `/_nuxt/**`, font files; `must-revalidate` for `*.html`; security headers stay global.
- Removed `Pragma`, `Expires` — HTTP/1.0 fallbacks that conflict with `immutable` semantics on some CDNs.

### `app/pages/index.vue`
- Imported the image manifest.
- Added `<link rel="preload" as="image" fetchpriority="high">` for the cover image in `head()`, with two entries gated by `media="(min-width: 768px)"` and `media="(max-width: 767px)"` so each viewport only preloads its own variant.

### `app/components/home/Cover.vue`
- Added `fetchpriority="high"` and `:alt` binding on the cover `<img>`.

### `app/components/AppPreloader.vue`
- `_loadImage` short-circuits when the element already has the target `src` and is `complete && naturalWidth > 0`. Prevents redundant `src` reassignment when `preloader.load()` re-walks `[data-pre]` on route navigation.
- Same idempotency guard added to the video-poster branch.

### `scripts/process-images.js`
- Added `ALT_TEXT` map at top.
- Normalised path separators on Windows (`relative(...).split(/[\\/]/).join('/')`).
- Output format unified to WebP for all rasters (`.webp`, `quality: 80`/`75`). Removed the per-extension `encode()` helper.
- Manifest entries now include `alt` when an entry exists in `ALT_TEXT`.

### Component templates (alt text bindings)
- `Cover.vue`, `About.vue`, `Services.vue`, `PersonalApproachFigure.vue`, `Speaking.vue` (×8) — bound `:alt="images['…'].alt"`.
- `MapClients.vue` — bound `alt=""` on the three decorative map backgrounds.
- `Testimonials.vue` — already had `alt="Quote"`, left untouched.

### `app/image-manifest.json`
- Regenerated. Every raster entry now points at a `.webp` URL and carries an `alt` string where one was defined.

## Future work (not yet done)

- **AVIF + WebP fallback chain** via `<picture><source type="image/avif"><source type="image/webp"><img></picture>`. Sharp can emit AVIF in the same pipeline. Expected savings: another 30–50 % on top of the current WebP-only output.
- **CSP headers.** Powerful but requires whitelisting every external script/font/API. Configure carefully once the site is stable; a wrong CSP will visibly break things.
- **`bun run generate` build hook for `process-images.js`.** Currently manual — easy to forget after adding a new image. Could wire as a pre-build step.
