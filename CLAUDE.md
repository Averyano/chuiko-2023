# CLAUDE.md — chuiko-2023

A photographer portfolio SPA built with a custom Avery.js framework and Three.js for the WebGL canvas.

---

## Stack

| Tool | Version | Role |
|------|---------|------|
| Three.js | ^0.172.0 | WebGL rendering |
| GSAP | ^3.11.5 | Animations |
| Webpack 5 | ^5.75.0 | Bundler |
| Babel | ^7.20.x | JS transpilation |
| normalize-wheel | ^1.0.1 | Cross-browser wheel events |
| lodash | ^4.17.x | `each`, `map` utilities |

Build: `npm run build` — Webpack production + sitemap generation  
Dev: `npm start` — Webpack dev server

---

## Project Structure

```
app/
├── app.js                        # Entry point — App class, RAF loop, event routing
├── classes/
│   ├── Canvas.js                 # Base WebGL class (extends Component) — scene, renderer
│   ├── Component.js              # Avery base component (declarative DOM queries)
│   ├── Page.js                   # Extends Component — show/hide transitions
│   ├── GlobalHandler.js          # Static lifecycle registry (create/resize/destroy)
│   └── NodeEmitter.js            # EventEmitter with globalEmitter broadcast
├── components/
│   ├── Canvas/
│   │   ├── Experience.js         # ⭐ Main Three.js scene controller (extends Canvas)
│   │   ├── Gallery/
│   │   │   ├── index.js          # Manages all mesh items, scroll loop, raycasting
│   │   │   ├── GalleryItem.js    # Thumbnail mesh (horizontal scroll strip)
│   │   │   └── MainGalleryItem.js # Large preview mesh (top-left display)
│   │   ├── Camera.js             # OrthographicCamera wrapper
│   │   ├── Lights.js             # AmbientLight + DirectionalLight
│   │   ├── Raycaster.js          # THREE.Raycaster for hover detection
│   │   ├── LensDistortionShader.js # Custom post-processing shader
│   │   └── TopMeshCover.js       # (unused/experimental)
│   ├── Navigation.js             # Nav bar component
│   └── @avery-loader/            # SPA router + preloader (Avery framework)
├── pages/
│   ├── Home/index.js             # Home page (template: "home")
│   └── NotFound/index.js
└── utils/
    ├── utils.js                  # lerp, debounce, checkWebpSupport
    └── threeCover.js             # CSS background-cover equivalent for textures

shared/shaders/
├── image.vert / image.frag       # Shader for gallery thumbnail meshes
├── av.vert / av.frag             # (alternate/unused)
├── bgimage.vert / bgimage.frag   # Background image shader
├── topmesh.vert / topmesh.frag   # TopMesh shader
└── vertex.glsl / fragment.glsl   # Generic fallback shaders
```

---

## Architecture: How It All Fits Together

### App lifecycle (`app.js`)
1. `new App()` runs on load
2. `create()` calls `createContent()` → `createPreloader()` → `createNavigation()`
3. `update()` starts the RAF loop immediately — calls `experience.update()` every frame
4. Input events (`wheel`, `mousedown/move/up`, `touchstart/move/end`) are captured at App level and forwarded to `experience`
5. When preloader finishes (`onPreloaded`), `new Experience('.webgl')` is created (home page only)
6. On page transition, `GlobalHandler.handleDestroy()` runs; Experience is NOT destroyed on nav (it persists)

### Experience.js — scene controller
`Experience extends Canvas` which extends `Component`.

Key responsibilities:
- Owns `Camera`, `Gallery`, `Lights`, `Raycaster`, `EffectComposer`
- `isReady` flag gates the RAF loop — set to `true` after init
- `update()` per frame: runs raycaster → gallery update → composer render
- Raycaster uses a fixed screen-space point (`{x: 0, y: -0.95}`) — NOT mouse position — to detect which gallery item is centered at the bottom
- `onWheel({pixelY})` — drives `gallery.speed.target` and distortion velocity
- `onTouchDown/Move/Up` — forwards touch values as `{x: {start, end}}` to gallery

### Gallery (`Canvas/Gallery/index.js`)
- Reads DOM bounds from `.gallery__image` elements to position meshes in world space
- Uses `OrthographicCamera` so 1 pixel = 1 world unit — mesh scale equals DOM pixel size
- `createItems()` returns a Promise; loads textures in order then creates `GalleryItem` meshes
- Infinite horizontal scroll: items wrap using `extraX` offset compared against `maxWidth`
- `setActive(null, uuid)` — called when raycaster hits a new mesh; updates the main preview image
- `pauseRaf()` / `playRaf()` — controls `isAutoplay`; auto-resumes after 5s idle

### GalleryItem (`Canvas/Gallery/GalleryItem.js`)
- One PlaneGeometry(1,1,6,6) mesh per thumbnail image
- Uses `image.vert` / `image.frag` shaders
- Shared uniforms passed from Gallery: `uSpeed`, `uScrollVelocity`, `uOffset`
- Per-item uniforms: `uTexture`, `uScale`, `uResolution`, `uZoomScale`, `uDarken`, `uMouse`, `uProgress`
- `update()` sets `mesh.position.x` based on bounds + `extraX` (scroll offset)
- `fullSrc` is derived from thumbnail src by stripping `thumbnail/` path and `-thumbnail` suffix

### MainGalleryItem (`Canvas/Gallery/MainGalleryItem.js`)
- Single large mesh showing the currently hovered image
- Positioned to match the `.main__image--w` or `.main__image--h` DOM element bounds
- `uDarken` driven by raycaster: 0.5 on all inactive items, 1.0 on active

### Camera
- `OrthographicCamera` — frustum matches viewport exactly (width/height in world units = pixels)
- Position: `(0, -scrollY, 10)` — Y tracks page scroll
- Resize: `resizeCamera(sizes)` updates frustum bounds + calls `updateProjectionMatrix()`

### Post-processing (EffectComposer)
- `RenderPass` → `ShaderPass(LensDistortionShader)`
- Distortion driven by `velocity` (lerped scroll speed, clamped ±120) and `extraDistort`
- `baseIor` and `bandOffset` uniforms animate with velocity for chromatic aberration on scroll

### Raycaster
- Fixed ray from `{x: 0, y: -0.95}` (bottom-center of screen) — simulates "active item in strip"
- On mobile: `{x: 0, y: -0.75}`
- `update()` runs every frame in `Experience.update()`; sets `currentIntersect`
- When intersect UUID changes → calls `gallery.setActive(null, uuid)`

---

## Shader Conventions

- Shaders live in `shared/shaders/` and are imported via webpack glsl-loader
- Gallery items use `image.vert` + `image.frag`
- Common uniforms pattern:
  ```glsl
  uniform sampler2D uTexture;
  uniform vec2 uResolution;    // cover-scale aspect correction
  uniform float uScrollVelocity; // drives wave/distortion in vertex shader
  uniform float uDarken;       // 0.5 dimmed, 1.0 active
  ```

---

## Coordinate System

Camera is orthographic, viewport = world units in pixels:
- Origin (0,0) = screen center
- X: positive = right
- Y: positive = up (inverted from DOM)
- Z: camera at z=10, items at z=-1 (thumbnails), z=-1.5 (main item)

To convert DOM bounds to world position:
```js
x = (bounds.left + bounds.right) / 2 - sizes.width / 2
y = -((bounds.top + bounds.bottom) / 2) + sizes.height / 2
```

---

## Key Patterns & Rules

- **No PerspectiveCamera** — the orthographic setup is intentional; do not switch to perspective
- **Shared uniforms object** — `gallery.uniforms` is passed by reference into every GalleryItem; changing it affects all items simultaneously
- **`frustumCulled = false`** on all scene objects — intentional workaround to prevent pop-in lag
- **`window.isMobile`** — set in App and checked in Experience/Gallery; threshold is 768px
- **`window.experience`** — Experience instance exposed globally for debugging
- **WebP support** — `GlobalHandler.isWebpSupported` is set from preloader; used in `getBounds()` to pick `data-pre-webp` vs `data-pre` attributes
- **Texture path convention**: thumbnails at `/images/thumbnail/NAME-thumbnail.jpg`, full at `/images/1x/NAME.jpg`
- **`extraDistort`** — `{target, current}` lerped object in Experience; bumping `target` adds temporary extra chromatic aberration
- **No ScrollTrigger** — this project does not use GSAP ScrollTrigger; scroll is manual via `onWheel`

---

## Debugging

Debug elements in the DOM (`.dbg1`–`.dbg4`) display live values:
- `.dbg1` — mouse.x
- `.dbg2` — mouse.y
- `.dbg3` — raycaster isIntersecting
- `.dbg4` — current intersect UUID

`window.experience` gives full access to the Experience instance in the console.
