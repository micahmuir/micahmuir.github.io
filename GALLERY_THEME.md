# Gallery Theme: Project Split-View Format

Notes on the `Gallery-Theme` branch — a new layout format for project pages, plus the
fixes required to make it coexist with the site's existing global scripts.

## The format change

Project pages previously rendered as a single scrolling column straight from the Notion
export: a paper panel with the write-up, media embedded inline wherever it appeared in
the document. The new format splits the page into two halves:

- **Media rail** — a large "stage" showing one piece of media at a time (YouTube embed
  or image), a caption line under it, and a horizontal **thumbnail ribbon** of all the
  project's media beneath that.
- **Write-up column** — the cleaned-up article text, with its inline figures preserved.

On desktop the rail sits sticky on the right while the write-up scrolls on the left.
Below 960px the rail stacks on top of the write-up.

### How the ribbon works

The ribbon is the source of truth ([project-split.js](assets/js/project-split.js)).
Each thumb is a `<button class="media-thumb">` declaring its media via data attributes:

```html
<button class="media-thumb is-video" type="button" data-type="youtube" data-id="VIDEOID"
        data-caption="Shown under the stage">
  <img src="https://img.youtube.com/vi/VIDEOID/mqdefault.jpg" alt="" loading="lazy">
</button>

<button class="media-thumb" type="button" data-type="image" data-src="photo.png"
        data-caption="Shown under the stage">
  <img src="photo.png" alt="" loading="lazy">
</button>
```

- The first thumb loads into the stage on page load (videos don't autoplay on load;
  they do when clicked).
- Clicking a thumb swaps the stage content in place.
- Clicking the stage while it shows an image toggles fullscreen (real Fullscreen API,
  with a CSS pseudo-fullscreen fallback for iOS).
- `is-video` thumbs get a play-badge overlay.

### Pages converted so far

- [Test Card](personal_projects/test_card_project/Test%20Card.html) — the reference
  implementation.
- [Companion Stairlight](personal_projects/stairlight_project/Companion%20Stairlight.html)
  — Notion-export markup replaced with the hand-written structure; captions written
  from the actual photo contents.

To convert a page: copy the Test Card skeleton (`.project-split` >
`.project-media-rail` + `.project-writeup`), fill the ribbon with the page's media,
move the article text into the write-up column, and include both
`assets/js/main.js` and `assets/js/project-split.js` at the end of the body.

## The bugs we worked through

All three bugs came from the same root cause: the new layout lives alongside two
long-standing **global** systems in [main.js](assets/js/main.js) — the gallery overlay
(which makes every content image clickable) and the page-transition system (which
intercepts every internal link click). Both were written before the split view existed,
and both grabbed clicks that now belong to the new components.

### 1. Ribbon thumbnails opened the fullscreen gallery instead of swapping the stage

**Symptom:** clicking a thumbnail opened the image in the site-wide gallery overlay
across the whole screen, rather than loading it into the stage.

**Cause:** the gallery's `makeMediaClickable()` attaches an open-the-overlay click
handler to every image matching broad selectors like `.main-content img` — which
matched the `<img>` inside every ribbon thumb button.

**Fix:** `makeMediaClickable()` now skips anything inside `.project-media-rail`
([main.js:297-301](assets/js/main.js#L297-L301)). The rail handles its own clicks:
thumbs swap the stage, the stage handles its own fullscreen. Write-up images keep the
gallery behavior.

### 2. Stacked layout: media view and write-up fought over one scrollbar

**Goal:** when the layout stacks (below 960px), scrolling in the write-up should move
only the write-up while the media view stays put; scrolling on the media view should
scroll the whole page so the media can slide away and give the write-up more room.

**Fix:** in the narrow breakpoint the write-up becomes its own scroll container
([style.css:1805-1830](assets/css/style.css#L1805-L1830)):
`max-height: calc(100vh - 90px)`, `overflow-y: auto`, and — the important part —
`overscroll-behavior: contain`, which stops the scroll from chaining to the page when
the write-up hits its top or bottom. Page scrolling elsewhere is untouched. The
write-up gets the same thin themed scrollbar as the ribbon as a hint that it scrolls
independently.

**Known limitation:** on touch devices, scrolling that starts on the YouTube iframe
won't scroll the page (cross-origin iframes consume their own touch/wheel events).
The caption, ribbon, and margins around it all work.

### 3. Inline write-up images navigated to the raw image URL instead of the lightbox

**Symptom:** clicking an inline figure went from
`.../Companion%20Stairlight.html` to `.../stairlight3.jpg` — the browser just opened
the image file.

**Cause:** a three-way pileup on one click. Notion-export figures wrap images in plain
anchors (`<a href="stairlight3.jpg"><img ...></a>`). The gallery's image handler runs
first and opens the overlay, but the page-transition system's document-level click
interceptor *also* fires, decides `stairlight3.jpg` is an internal link, and does its
own `window.location.href` navigation 400ms later — clobbering the open lightbox. The
gallery's `preventDefault()` couldn't stop it, because the transition handler navigates
manually rather than relying on the link's default action.

**Fix:** the transition interceptor now bails out when the event was already handled:
`if (e.defaultPrevented) return;` ([main.js:19-22](assets/js/main.js#L19-L22)). The
gallery handler sits deeper in the DOM so it always runs first and marks the event.
This fixes every Notion-exported page at once, since the interception is global.

**Debugging notes:** this one looked unfixed after the fix, which sent us down a
verification rabbit hole worth remembering:

- Static code reading couldn't explain the surviving bug, so we reproduced the click
  in headless Chrome against the actual Live Server
  (`chrome --headless=new --dump-dom` with a probe script injected into a disposable
  copy of the page).
- A first probe that dispatched `click` directly on the `<img>` passes trivially — it
  bypasses browser hit-testing, so it can't catch elements covering the image or
  `pointer-events` issues. The better probe uses `document.elementFromPoint()` at the
  image's on-screen coordinates and clicks whatever the browser says is really there.
- With real hit-testing, the fix verified clean at desktop (1400px) and stacked
  (700px) widths: click hits the image, default is prevented, overlay opens, no
  navigation. Remaining sightings of the bug were a stale cached `main.js` in the
  browser tab — Live Server reloads the page on file changes, but the browser can
  still serve the old script from cache. **Ctrl+Shift+R** (or "Empty Cache and Hard
  Reload") is the answer; there is no service worker in this project that could pin
  old code.

## Files touched

| File | Change |
|---|---|
| [assets/js/project-split.js](assets/js/project-split.js) | New: stage/ribbon behavior, fullscreen handling |
| [assets/css/style.css](assets/css/style.css) | New "Project split view" section; stacked-mode independent scrolling |
| [assets/js/main.js](assets/js/main.js) | Gallery skips the media rail; transition interceptor respects `defaultPrevented` |
| [Test Card.html](personal_projects/test_card_project/Test%20Card.html) | First page in the new format |
| [Companion Stairlight.html](personal_projects/stairlight_project/Companion%20Stairlight.html) | Converted to the new format |

---

# Ink-Boundary Theme (About page test)

A second experiment on this branch: the About page's background visual is no longer
the watercolor bloom canvas — it's a tiny GPU simulation of **two liquids**. The
background itself is an ink: a parchment-toned liquid with visible internal marbling
that reacts when stirred. Each content pane is a blob of dark ink suspended in it —
not drawn as a rectangle at all, but a region of strong dye injection inside the same
advected fluid field as its bleed, so the pane body, its edge, and its tendrils are
one continuous substance. An interface-shear term adds swirl along every dye boundary,
so where the two inks meet they actively roll up and curl into each other: ink mixing
with ink, not ink running into paper.

Current palette: near-black warm grey pane ink (`#20221f`) in a background liquid
that marbles between creamy beige (`#f2ead9`) and deep parchment (`#d2c5a6`).

## Architecture

All of it lives in `createInkBoundaryVisual()` in [assets/js/main.js](assets/js/main.js)
(section header "BACKGROUND VISUAL 3"). Cost per frame: three fragment passes over a
reduced buffer (≤1200px long side, ≤0.62× resolution) — dye step, brush step,
colorize. No geometry, no CPU per-pixel work; ~2 ms/frame on integrated graphics.

- **Dye field**: two ping-pong RGBA byte textures. R = pane ink (body + everything it
  sheds), G = the background liquid's density. Semi-Lagrangian advection each frame.
- **Brush field**: a second ping-pong texture pair holding the user's ink in TRUE
  COLOR — premultiplied rgb, amount in alpha — advected through the identical flow
  (shared `velocityAt` shader chunk). New splats are tinted with the current brush
  color; laid ink keeps the color it was painted with, and overlapping strokes mix
  premultiplied-style, like pigments. Changing the brush color never recolors
  existing ink. Injection deposits only into remaining coverage (else rgb would
  accumulate past the pigment color and clamp to white); leftover paint on a
  saturated area re-pigments it gradually, so painting over a wet area mixes.
- **Velocity**: curl of a two-octave value-noise stream function (divergence-free =
  reads as liquid), plus an **outward bleed current** along the SDF gradient near
  every pane edge so the panes continuously push ink away, plus **interface shear**:
  extra velocity along the iso-contours of dark-ink density (the density gradient
  rotated 90°), which makes every ink/background boundary roll up into curls. The
  shear speed *saturates* (`min(gm/0.3, 1) * uShear`) — without the cap it feeds
  back (stretching sharpens the gradient, which shears harder) and the mixing layer
  runs away until ink floods the screen.
- **Background liquid**: G relaxes toward a slowly drifting two-octave noise pattern
  (`bgRate` per second), so the background always shows marbling, and anything that
  stirs or displaces it leaves a wake that heals. A ±½-LSB per-frame dither keeps
  the tiny relaxation increments alive through byte-texture rounding. Brush splats
  *subtract* G — the stroke shoves the background liquid aside, leaving a light rim.
- **Pane geometry**: visible content blocks (`.navbar`, `.paper-panel`, `.card`, …)
  are gathered every frame via `getBoundingClientRect` into a rounded-rect SDF
  (max 8 rects, corner radius matches `--border-radius`). The SDF is then
  displaced by slow drifting two-octave noise (`amorph`, CSS px), so the blob's
  outline **meanders** instead of tracing the straight CSS rectangle — tendrils
  root on an organic edge at varied angles, never marching off a ruler line.
  Because rects are re-measured per frame, panes track scrolling, hover-lift
  transforms, and the navbar's auto-hide slide automatically. The fixed navbar is a special case: its
  top and side edges are pushed far offscreen before upload, so only its bottom
  edge lives in the fluid — no rounded corners or stray tendrils at the screen
  border. Its glass chrome is stripped by a `.page-about.ink-active .navbar` rule;
  the nav links render directly on the ink.
- **Sources** (all in the step shader, all strictly attached to the pane):
  - `srcPane` — saturating injection deep inside each pane, ramping off toward the
    edge. Keeps the interior solid while leaving the boundary shell slow-fed enough
    that the turbulence genuinely erodes and folds it. This is what makes the pane
    read as a blob of ink rather than a rectangle with decorations.
  - `root` — a thin ribbon wetting the entire perimeter, thickness breathing with
    noise.
  - Gated **fingers** — a *thresholded* noise opens discrete seep gates; the noise is
    sampled at each pixel's projection onto the pane edge, so a gate value is
    constant along its outward ray and an open gate grows a complete radial tendril
    rooted on the pane. The gate field crawls slowly (fast drift smears fingers into
    smudge within one dye lifetime — learned the hard way).
  - All sources start slightly *inside* the edge (invisible there — same color as the
    body) so nothing can ever appear detached from the pane.
  - **Motifs** — a procession of recognizable silhouettes (gear, mug,
    paintbrush, open book, magnifying glass, peace sign, scissors, power drill,
    wrench, boot) that rise from behind the bio pane's edge, turn as they arc
    along it, and set back into it. One launches every `motifCycle` (10s) and a
    pass takes `motifShow` (26s), so **two or three are always in the air** at
    different stations — hence the uniform arrays and `maxMotifs`. Built as SDFs
    (`sdGear`, `sdMug`, `sdBrush`, `sdBook`, `sdLens`, `sdPeace`, `sdScissors`,
    `sdDrill`, `sdWrench`, `sdBoot`) in each shape's own rotated frame, wobbled by
    the same `bump` noise the panes use so the outline is hand-inked rather than
    plotted, and each skipped outside its bounding circle so the cost stays
    local. The **occlusion is arithmetic, not masking**: this is the one source
    that RELAXES toward a target (`max(0, target - dye.r)`) instead of adding,
    at a density (`motifInk` 0.70) under the pane's saturated 1.0 — so it lifts
    thin ink up to tendril shade and does nothing at all where the pane's own
    ink is denser. It is therefore invisible under the pane body and its inner
    halo, and surfaces only out in the tendril zone.
    Tuning notes, each learned by looking:
    - `motifRate` (20/s) is the recognizability knob. The flow drags ink off the
      shape at ~35 CSS px/s; at 1.7/s the gear was an unreadable smudge and at
      8/s the brush handle still dissolved. A hard stamp keeps the silhouette
      while the flow takes only what leaves it — which is the intended look.
    - The coverage ramp must be TIGHT (`uBand * 0.06`). At `0.22` it spanned
      ~24 CSS px, wider than a brush handle, so slender shapes never reached
      full density and faded out while the chunky gear survived.
    - The rise is measured against the ink mass, not the CSS rect: the pane's
      halo stays saturated ~60 CSS px out and only thins near ~110. `motifPeak`
      is deliberately shallow (1.05 radii) so most of each shape stays buried —
      which is why the density has to be high. The two trade directly: the less
      of a silhouette clears the ink, the darker it must be to read at all.
    - Only a *slice* of each shape ever shows, so the slice has to carry it.
      Round shapes are fine; elongated ones are laid ALONG the edge they rise
      from (`alongEdge`), because a slice across a brush is an unreadable blob
      while a slice along it still reads as a brush. The brush's handle /
      ferrule / bristle widths are stepped well past real proportions for the
      same reason — that stepped side profile is the whole of what shows. The
      mug's body tapers toward its base and its handle hangs low, so its lower
      half alone still reads as a vessel; the lip slot, its clearest cue, sits
      too high to be seen at this peek depth.
    - Shapes need internal negative space to read at low contrast — the gear's
      bore, hub gap and spokes; the magnifier's lens ring; the peace sign's
      cut-up circle; the scissors' handle loops; the wrench's ring end and open
      jaw. Two rules govern every silhouette: **no feature thinner than ~0.1R**
      (the flow erases anything finer however hard it is re-stamped) and **put
      the identifying feature LOW in the frame**, since a shallow rise only ever
      shows the lower part — which is why the magnifier carries its lens down
      and its grip up, and the drill is nose-dipped.
    - Two orientation bugs worth remembering, both invisible in code review and
      obvious on sight: a subtraction cut on the wrong side (the wrench's jaw
      notch faced its shaft, so it read as a second closed ring), and a slot
      sized against the wrong dimension (the book's page lines nearly split its
      leaves into planks).
    - The icon geometry is far quicker to check in isolation than in the
      procession — `mkpreview.ps1` in the session scratchpad lifts the SDF GLSL
      straight out of `main.js` and renders all ten in a grid, with a shaded
      band marking how much of each stays sunk in the ink at `motifPeak`.
    - Rotation is gentle (`motifSpin`, ~50° across a pass) and PHASED: a launch
      starts half a pass' turn before the shape's natural angle, so it passes
      through upright at the peak, when the most of it is out of the ink. At
      double this rate the brush ended up sideways and unreadable.
    - Stations (which pane edge, where along it) are taken at launch from those
      with `motifRadius * 1.8` of room outside that nothing else occupies — so
      a shape never rises into the viewport border, and two never overlap. The
      station list is therefore also the concurrency cap: on a laptop width
      only the bottom edge has room, so it carries five stations. With fewer,
      the 10s launch cadence silently throttled to "whenever one frees up".
    - Positions are recomputed from the pane's live rect every frame, so the
      procession rides scrolling and reflow for free. Under
      `prefers-reduced-motion` the clock stops and one shape holds a quiet peek.
- **User ink**: clicking the open background drops an ink splot; click-dragging lays
  stroke stamps along the pointer path — both are gaussian injection bursts
  (`uSplats`, up to 16 live) into the brush field, which the fluid then mixes like
  any other ink. Clicks on panes, links, and controls are excluded (`NO_PAINT`
  selector). Splats are stored in document space so they stay put when the page
  scrolls.
- **Placeable objects** (control-table buttons, both document-anchored, max 8
  each, oldest dropped; **Clear objects** removes them all):
  - *Flow emitter* — arm the button, then click-drag: press = position, drag =
    the flow vector (length sets speed via `emitterGain`, between `emitterMin`
    and `emitterMax`). Drags under 8px are ignored (accidental click) and the
    button stays armed. The jet is a LAMINAR LANE inside the shared
    `velocityAt`: elongated downstream (reach grows with speed, up to
    ~7×`emitterRadius`), narrow across the axis, velocity decaying smoothly
    along it — and inside the lane the ambient turbulence (85%) and interface
    shear (70%) are suppressed in proportion to lane weight, so carried
    pigment travels as a long concentrated stream that only breaks up where
    the lane dissipates. All three fluids ride it. Each emitter shows its
    vector as an ink-styled SVG arrow (dot = position, length ~ speed, ring
    handles marking both ends) in a document-anchored `.ink-arrows` overlay.
    The placement drag is itself a LIVE emitter — `updatePlaced()` feeds the
    in-progress drag to the sim as an extra emitter, so the jet blows while
    it is being aimed and commits seamlessly on release. A committed arrow
    is a grab handle: dragging its body (origin ring) MOVES the emitter,
    dragging its HEAD ring RE-AIMS the vector (direction + speed, like
    placement) — jet following live. Arrows are removed by Clear objects/stop
    and hidden in print.
  - Placement modes are STICKY: keep placing until the armed button is
    clicked again (or another mode button / Clear objects is pressed). Object
    handles stay live while a mode is armed — the move that usually follows a
    placement is a nudge of the thing just placed, so the grab has to win over
    placing another one on top of it.
  - **Faint until pointed at**: placed arrows and source markers sit at 0.26
    opacity so they don't compete with the ink, easing to full on hover or for
    the duration of a drag (a `.dragging` class, since the pointer leaves the
    element mid-drag). Touch devices (`hover: none`) hold them at 0.7 — there
    is no hover to reveal them with. The live placement preview never fades.
  - **Double-click an object to delete it** — both arrows and source markers;
    the control table carries this as a one-line note under the placement
    buttons. Deletions go through the undo history like any other mutation.
  - **Undo/redo** (↺/↻ mini-buttons): snapshot history of the placed objects
    (max 40 entries) covering placements, deletions, moves, re-aims, and
    Clear objects. Snapshots are pushed *before* each mutation; move/re-aim drags
    commit their pre-drag snapshot lazily on first real movement, so no-op
    clicks never pollute the history. The ink fields are not part of history.
  - Placement uses a looser exclusion than painting (`NO_PLACE`): panes are
    allowed (they're fluid — an emitter under a blob carves flow through it);
    only links, nav, and the control table are off-limits.
  - **Persistence**: placed objects and all panel settings survive navigation
    within a visit — `sessionStorage`, keyed `inkState:<pathname>` (~300
    bytes), saved on every mutation, restored at sim init *before* warmup so
    source pools are already soaked in at first paint. Not saved: the dye
    fields themselves (free-hand strokes are ephemeral by design). Dies with
    the browser session; storage failures (private mode) degrade silently.
  - *Ink source* — arm the button, then click the background: a persistent
    bleeding pool that injects brush-field ink at `sourceRate`, forever tinted
    with the brush color at placement (colors stored per source in
    `uSrcCol`). Sources also shove the background liquid like brush strokes.
    A pool is invisible as an object, so it gets a small marker on its center
    in the same `.ink-arrows` overlay — a dot in the pool's own color inside a
    dashed 15px grab ring that washes charcoal on hover. That marker is the
    handle: drag it to move the pool, double-click it to delete it.
  - While armed the cursor is a crosshair and the button inverts to charcoal;
    placement exits the mode.
- **Clear canvas** (`clearFields()`): wipes the dye state rather than the
  objects — both ping-pong pairs are `gl.clear`ed to zero and the live splat
  list is dropped, then `warmup()` re-runs so the pane interiors, the
  background marbling, and any placed sources soak straight back in instead of
  flashing blank. Placed objects and panel settings are untouched, and because
  the fields were never part of the undo history the clear is not undoable.
- **Control table**: the sim appends a small fixed panel (`.ink-controls`,
  bottom-right) with live knobs — brush color, brush size, brush ink life
  (`brushDecay`, an exponential slider from ~6/s instant dispersal to ~0.006/s
  linger-for-minutes painting; its quantization sweep scales down with it so long
  life is not silently erased), turbulence (`flowSpeed`), mixing detail
  (`flowScale2`), shear (`shearSpeed`), bleed, and fade (`decayRate`, pane ink
  only). Sliders simply mutate
  `SIM` (uniforms are re-sent every frame). The panel exists only while the sim runs
  and is removed by `stop()`; print styles hide it.
  - Five of those knobs open at fixed fractions of their slider ranges:
    **turbulence 35%** (`flowSpeed` 4200 of 0–12000), **mixing 10%**
    (`flowScale2` 0.027 of 0.02–0.09, step tightened to 0.001 so a tenth of the
    range is an exact stop), **shear 20%** (`shearSpeed` 16 of 0–80), **bleed
    90%** (`bleedSpeed` 36 of 0–40), and **ink life 50%** (`brushDecay` 0.19 —
    the midpoint of the exponential curve, `6 * 0.001^0.5`). A returning visitor
    keeps whatever they last set: `sessionStorage` restores over these.
- **Scroll anchoring**: the advection lookup is offset by the per-frame scroll delta,
  so dye translates with the page content.
- **Warmup**: the pane body is accumulated dye, so whenever the sim textures are
  (re)created, 12 large sim steps run synchronously — first visible paint already has
  solid panes and mostly-formed background marbling.
- **Colorize pass**: ink-on-ink interpolation,
  `mix(mix(mix(bgLight, bgDeep, G), paneInk, R), brushInk, B)`.
  No tone mapping — the `SIM` hex colors are literal on-screen colors.
- **Shader gotcha (learned the hard way)**: swizzled compound assignment on two
  components (`dye.rb *= x`) miscompiled in at least one GL stack — the decay
  silently stopped applying and pane ink slowly flooded the screen. Write
  per-component (`dye.r = dye.r * fade - …`) in this shader.

## Page integration

- `initBackgroundVisuals()` routes the About page to the ink sim; every other page
  keeps the watercolor canvas. If WebGL init or shader compile fails the function
  returns null and the watercolor fallback runs (compile failures log to console).
- On success the sim adds **`ink-active`** to `<body>`. CSS keyed on
  `.page-about.ink-active` then strips ALL pane chrome — background, border,
  box-shadow, backdrop blur, hover glows — because the sim paints the pane surfaces
  itself. No `ink-active` class → panes keep their normal glass styling.
- The `.page-about.ink-active` CSS background (screen-only) sits at the *midpoint*
  of `SIM.bgColor` and `SIM.bgDeep` (currently `#e2d7bf`) so uncovered page area
  blends into the marbling — **keep it in sync** when changing the palette.
- Text selection is disabled page-wide while `ink-active` (screen CSS) — click-drag
  is the paint brush, and selection highlighting fights it.
- `ink-active` also overrides `--theme-color`/`--theme-rgb` to the palette's cream,
  and recolors the nav links cream-on-charcoal, so no emerald accents remain while
  the ink theme runs.
- `prefers-reduced-motion` freezes the flow (panes and bands render, nothing stirs);
  hidden tabs pause the loop; print hides the canvas entirely.

## Tuning knobs (the `SIM` block)

| Knob | Effect |
|---|---|
| `bgColor` / `bgDeep` / `paneColor` / `brushColor` | The whole palette: background liquid (light + deep marbling tones), pane ink, brush ink. Literal on-screen colors |
| `bgRate` | How fast the background liquid re-forms its marbling after being stirred |
| `shearSpeed` | Interface shear — how aggressively the two inks curl into each other at every boundary. 0 = passive diffusion only |
| `decayRate` | Ink lifetime → how far bleed survives from the pane. **Raise to keep neighboring panes from merging into one pool**; lower for a connected inkscape |
| `injectRate` | Overall ink supply / density |
| `bandWidth` | Reach of the root/finger source region (CSS px) |
| `amorph` | Boundary wobble amplitude (CSS px). Total swing is ~±1.5× this — keep below the panes' text padding |
| `flowSpeed`, `flowScale1/2`, `flowEvolve` | Turbulence strength, swirl sizes, how fast the flow pattern morphs |
| `bleedSpeed` | Outward current — how insistently panes push ink away |
| `srcPane` ramp (in-shader `smoothstep(0.06, -0.35, s)`) | How deep the boundary shell erodes into the pane body |
| Gate threshold / `len` (in-shader) | Finger density and length |
| `hoverBoost` | Extra ink while a pane is hovered |

## Applying it to another page

1. In `initBackgroundVisuals()`, extend the routing condition beyond
   `page-about` (or route per body class with a per-page palette lookup, like
   `PAGE_PALETTES` does for the watercolor).
2. Give the page its own `bgColor`/`bgDeep`/`paneColor` if desired.
3. Duplicate the two CSS pieces for that page class: the chrome-stripping
   `.ink-active` rules and the background-color sync rule.
4. Check the page's content blocks are covered by the `INK_BLOCKS` selector, and
   that no page-specific text sits directly on the background (it would be hit by
   wash/tendrils — About keeps all text inside panes).
5. Sanity-check pane spacing: blocks closer than ~2× `bandWidth` will visually
   merge unless `decayRate` is raised.
