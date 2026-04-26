# Infinite Thumbnail Scroll — How It Works

*chuiko-2023 · Three.js orthographic gallery*

---

## 1. Camera Setup — 1 World Unit = 1 CSS Pixel

`Camera.js` creates an `OrthographicCamera` whose frustum exactly matches the viewport:

```js
new THREE.OrthographicCamera(
    width / -2,   // left
    width / 2,    // right
    height / 2,   // top
    height / -2,  // bottom
    1, 1000
)
```

**Result:** world origin (0, 0) sits at the screen center. Every world unit equals one CSS pixel. An item whose DOM center is at `(cx, cy)` maps to world position:

```
world_x =  cx - viewport_width  / 2
world_y = -cy + viewport_height / 2
```

The camera is placed at `z = 10`; thumbnail meshes sit at `z = -1`, main preview at `z = -1.5`.

---

## 2. DOM → World Coordinate Mapping

`GalleryItem.createMesh()` (lines 71–80) positions each mesh once at creation:

```js
const x = (bounds.left + bounds.right) / 2;   // DOM center x
const y = (bounds.top  + bounds.bottom) / 2;   // DOM center y

mesh.scale.set(bounds.width, bounds.height, 1); // mesh pixel size = DOM size
mesh.position.set(
    x - sizes.width  / 2,   // world_x
   -y + sizes.height / 2,   // world_y (DOM y is inverted)
    -1
);
```

This initial position is immediately overridden each frame by `GalleryItem.update()`.

**Important:** `update()` uses the **negated** formula:

```js
// GalleryItem.update() — line 147
mesh.position.x = -((bounds.left + bounds.right) / 2) + sizes.width / 2 + extraX;
//               = -(dom_center_x) + viewport_width/2 + extraX
```

The negation means items are mirrored horizontally relative to the DOM: a thumbnail on the **left** of the DOM strip appears on the **right** of the world/screen. This is consistent throughout the system — `scrollToItem`, `_normalizeExtraX`, and the wrap thresholds all use the same formula.

---

## 3. `extraX` — The Scroll Offset

`extraX` is the single number per item that drives all horizontal scrolling. It starts at `0`.

Every frame in `Gallery.update()`:

```js
item.extraX += speed.current;   // accumulate scroll offset
// then GalleryItem.update() applies it:
mesh.position.x = -(dom_center) + viewport_width/2 + extraX;
```

All items share the same `speed.current` increment, so they move as one rigid strip.

---

## 4. Speed / Velocity System

```js
this.speed = { current: 0, target: 0, lerp: 0.1 };
this.velocity = 0;      // Gallery's decay target
this.direction = 1;     // ±1
```

**Each frame** (Gallery.update()):
```
1. speed.current = lerp(speed.current, speed.target, 0.1)   ← smooth approach
2. speed.current = clamp(speed.current, -120, 120)
3. speed.target  = velocity * direction                       ← decay toward 0
```

Because step 3 resets `speed.target` to `velocity * direction` (and `velocity` is 0 most of the time), the target decays to zero every frame. Input events inject momentum by modifying `speed.target` directly *before* the frame runs:

| Input | Effect |
|-------|--------|
| Mouse wheel / trackpad | `speed.target += pixelY * 0.5` (Gallery.onWheel) |
| Touch drag | `speed.target = speedCurrent + xDistance * 3` |
| Autoplay | `speed.current = 1 * speedMulti * direction` (bypasses lerp) |
| Keyboard | `scrollToItem()` — GSAP tween, bypasses speed entirely |

`pauseRaf()` sets `velocity = 0` and schedules `playRaf()` after 5 s of idle.

---

## 5. Infinite Wrap Logic

`maxWidth` is computed in `getBounds()` via `checkMaxWidth()`:

```js
this.maxWidth = Math.max(this.maxWidth, bounds.width + bounds.left);
// = right edge of the rightmost thumbnail in DOM pixels
// = total width of the strip
```

Each frame, after updating `extraX`, the wrap check fires (Gallery.update() lines 393–410):

```js
// Right overflow → jump left
if (mesh.position.x > maxWidth - bounds.width - viewport_width) {
    item.extraX -= maxWidth;
}
// Left overflow → jump right
else if (mesh.position.x < -maxWidth + bounds.width + viewport_width) {
    item.extraX += maxWidth;
}
```

Jumping by exactly `maxWidth` places the item at the opposite end of the strip, making the loop seamless. Because all items move together, their relative spacing is preserved through the wrap.

The thresholds include `bounds.width` and `viewport_width` so that items wrap only after they are completely off-screen (not while still partially visible).

---

## 6. `scrollToItem()` — Click / Keyboard Navigation

Called from `onPointerClick` and `_navigateByKey`. Bypasses the speed system entirely.

```js
scrollToItem(item) {
    // Kill any running tween first
    if (this._scrollTween) this._scrollTween.kill();

    // Compute current world position directly from extraX
    // (mesh.position.x may be stale by one frame after a kill)
    const domCenter = (item.bounds.left + item.bounds.right) / 2;
    const currentPosX = -domCenter + sizes.width / 2 + item.extraX;

    // Delta = distance to bring item to world x = 0 (raycaster center)
    let delta = -currentPosX;

    // Shortest-arc: if |delta| > half the strip, go the other way
    if (Math.abs(delta) > maxWidth / 2)
        delta = delta > 0 ? delta - maxWidth : delta + maxWidth;

    // Snapshot current extraX for all items, then tween uniformly
    const startX = items.map(i => i.extraX);
    this.isScrollingToItem = true;

    GSAP.to({ t: 0 }, {
        t: 1, duration: 1.2, ease: 'power3.out',
        onUpdate: () => items.forEach((it, i) => { it.extraX = startX[i] + delta * proxy.t; }),
        onComplete: () => {
            this.isScrollingToItem = false;
            this._normalizeExtraX();   // ← cleans up any boundary overflow
        }
    });
}
```

While `isScrollingToItem = true`:
- The per-frame `extraX += speed.current` block is **skipped** (items only move via the tween)
- The raycaster's `setActive()` call is **blocked** in Experience.update() (prevents old-image flash)

---

## 7. `_normalizeExtraX()` — Post-Tween Cleanup

After a tween, items may have drifted past the wrap boundary by more than one `maxWidth` (e.g. rapid key presses). `_normalizeExtraX()` brings every item back within one wrap cycle using while-loops:

```js
_normalizeExtraX() {
    items.forEach(item => {
        const domCenter = (item.bounds.left + item.bounds.right) / 2;
        let posX = -domCenter + sizes.width / 2 + item.extraX;
        const wrapRight = maxWidth - item.bounds.width - sizes.width;
        const wrapLeft  = -maxWidth + item.bounds.width + sizes.width;

        while (posX > wrapRight) { item.extraX -= maxWidth; posX -= maxWidth; }
        while (posX < wrapLeft)  { item.extraX += maxWidth; posX += maxWidth; }
    });
}
```

---

## 8. Shaders

### `image.vert` — Vertex Shader

**Scroll wave deformation** (`deformationCurve`, line 15–19):
```glsl
position.x -= sin(uv.y * PI) * min(|uScrollVelocity|, 15.0) * sign(velocity) * -0.0015;
```
Each thumbnail bends horizontally in a sine curve along its height as it scrolls. The amplitude is clamped to 15 speed units × 0.0015 scale ≈ a max of ~22.5px bend at full speed. Direction follows scroll direction via `sign(velocity)`.

**`uProgress` zoom** (lines 27–31): unused in normal operation (`uProgress` stays 0); was designed for a fullscreen expansion animation.

### `image.frag` — Fragment Shader

**`CoverUV(u, s, i)`** (lines 26–31): CSS `background-size: cover` in GLSL. Takes:
- `u` = raw UV (0→1)
- `s` = `uResolution` (mesh pixel dimensions)
- `i` = `uImageRes` (texture pixel dimensions)

Computes the scale factor to fill the mesh without stretching, then offsets UVs to center the crop.

**`rgbShift()`** (lines 13–17): samples red channel with `uOffset` displaced UV, GB channels at plain UV — a cheap chromatic aberration effect. `uOffset` is driven by the post-process distortion pass in Experience.

**`uDarken`** (line 38):
```glsl
gl_FragColor = vec4(color * uDarken, 1.0);
```
- `0.5` → dimmed (inactive thumbnails)
- `1.0` → full brightness (active or hovered item)

---

## 9. Data Flow Summary

```
User input (wheel / touch / key)
        │
        ▼
speed.target modified                 scrollToItem() called
        │                                     │
        ▼                                     ▼
Gallery.update() every frame          GSAP tween (1.2s)
  speed.current = lerp(→target)       moves all extraX by delta
  extraX += speed.current             isScrollingToItem = true
  wrap check (both directions)
        │                                     │
        ▼                                     ▼
GalleryItem.update()                  onComplete: isScrollingToItem=false
  mesh.position.x =                           _normalizeExtraX()
    -(dom_center) + W/2 + extraX
        │
        ▼
Three.js renders strip
  image.vert: sine-wave bend
  image.frag: CoverUV + rgbShift + uDarken
```

---

## Files

| File | Role |
|------|------|
| `app/components/Canvas/Gallery/index.js` | Strip orchestration, speed, wrap, scrollToItem |
| `app/components/Canvas/Gallery/GalleryItem.js` | Per-item mesh, extraX update, position formula |
| `app/components/Canvas/Camera.js` | OrthographicCamera frustum setup |
| `app/classes/Canvas.js` | WebGLRenderer, scene, base sizes |
| `app/utils/threeCover.js` | Texture aspect ratio helper (always returns `{x: imageAspect, y: 1}`) |
| `shared/shaders/image.vert` | Scroll-wave vertex deformation |
| `shared/shaders/image.frag` | CoverUV, rgbShift, uDarken |
