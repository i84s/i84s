# Creative direction — "Engineering excellence. Built to last."

## Concept: light reveals the finish

On site, a wall's finish is judged under **raking light**: a lamp held low and
parallel to the surface turns every ridge, pinhole and trowel mark into a
shadow. A surface that survives raking light is a surface done right.

The site is built on that idea. It is staged like a materials studio at night:
graphite surroundings, plaster-white type, and low light sweeping across real
construction finishes. Three motifs carry the story:

| Motif                                                               | Where                                                   | Meaning                                                                                                                  |
| ------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Raking light on mineral surfaces**                                | Hero (real-time WebGL), material studies, closing title | Quality you can inspect                                                                                                  |
| **The level line** — a thin line of light like a construction laser | Preloader, hero, page curtain, contact                  | Precision; the horizon the work is measured against                                                                      |
| **Layers**                                                          | The exploded build-up, the solution pages               | DRYCHEM's portfolio literally forms the layers of a wall or floor: structure → leveling → adhesion → finishing → coating |

In the hero, the level line falls across a coarse plaster surface and breaks up
over the relief. As the surface "finishes" (on load, then on scroll), the
relief flattens and the line straightens.

## Design system

**Colour.** A neutral mineral palette (graphite, stone, bone, plaster) carries
the whole interface. One **brand slot** (`--brand-primary`) supplies every
accent: the level line, focus rings, progress bars, active states and the map.
It is currently a provisional warm mineral tone. Set the official DRYCHEM
colour and the whole site follows (see `BRAND-SLOTS.md`). On light surfaces the
accent is darkened with `color-mix()` to keep AA contrast for small text.

**Typography.** Archivo, a grotesque with a 62–125 % width axis, is used
slightly condensed and tightly tracked for display type and normal width for
body text. JetBrains Mono sets technical labels: indices, captions, grades and
figures, like annotations on a drawing. Sizes form a fluid `clamp()` scale
(`--step--2` … `--step-6`).

**Layout.** A 12-column grid with fluid margins and gutters. Chapters
alternate dark and light surfaces, so each one reads as a new "room". Every
chapter opens with a numbered mono eyebrow (`01 — About` …). Fine 1 px rules,
registration marks and grid-paper backgrounds reference technical drawings.

**Imagery.** Official photography was unavailable, so the site uses
_material studies_: physically lit height fields of putty, plaster, concrete,
notched adhesive, primer, powder and texture (`scripts/render_materials.py`).
They are honest, on-brand placeholders, deliberately not fake product shots,
and every one sits in a slot sized for real DRYCHEM photography.

## Motion system

Motion should feel **heavy and precise**: materials settling into place, never
bouncing. There is no elastic, spin or shake anywhere.

| Token      | Value                            | Use                                                              |
| ---------- | -------------------------------- | ---------------------------------------------------------------- |
| `settle`   | `cubic-bezier(0.16, 1, 0.3, 1)`  | Default reveal: decelerates like a heavy material coming to rest |
| `sweep`    | `cubic-bezier(0.76, 0, 0.24, 1)` | Curtains, clip wipes, lines being drawn                          |
| `power2/3` | GSAP built-ins                   | Micro-interactions and scrubbed camera moves                     |
| Durations  | 0.35 / 0.6 / 0.9 / 1.2 / 1.5 s   | micro / fast / base / slow / hero                                |

### Choreography

1. **Opening (≈2.2 s, first visit only).** A level line draws across the
   screen, the name and a counter rise through masks, then the screen splits
   along the line to reveal the hero. A repeat hard load in the same session
   plays only a short split, which hides hydration. Reduced motion gets a
   fade.
2. **Hero.** Exposure rises, the laser line is drawn left to right, and the
   surface settles from raw plaster towards a finish. The headline lines rise
   through masks and the supporting copy follows. The light follows the
   pointer on desktop.
3. **Hero → About.** The hero is sticky; the About chapter slides over it like
   a sheet laid onto a wall. Scroll completes the surface's finish and dims it.
4. **About.** The statement's words light up as you read through them
   (scrubbed). The figure opens with a clip-path wipe while its image settles
   from a zoom, and figures count up.
5. **Build-up.** The stage pins. A slow camera orbit runs while the stack
   explodes, then each layer lifts in turn as its panel crossfades, tracked by
   a progress rail. On small screens and with reduced motion it becomes a
   plain vertical list.
6. **Index.** A material preview follows the cursor and wipes between rows.
7. **Research.** Technical drawings draw themselves, the value-chain line is
   scrubbed and switches nodes on, and material studies drift at different
   depths.
8. **Reach.** Export arcs draw out from Navi Mumbai and light pulses travel
   along them. The map stays put while the facts scroll past.
9. **Closing.** A band of light rakes across "Built to last." as you arrive.
10. **Page transitions.** A graphite curtain rises carrying the destination's
    name and a level line, the route changes underneath, and the curtain lifts
    into the new page's entrance.

### Interaction details

- Buttons: rolling label, fill wipe from below and arrow hand-off. The primary
  CTAs are magnetic on fine pointers.
- The cursor follower (fine pointers only) keeps the native cursor. It grows
  over links and shows a label over previews.
- The header picks its theme from the section beneath it, hides on scroll
  down and returns on scroll up. Its 1 px progress rule fills as you read, and
  a sliding indicator marks the current chapter.

## About the reference video

The brief named `Horyx Studio.mp4` as the motion reference, but the file never
reached the build environment, so it could not be analysed scene by scene.
The motion above therefore follows established premium-studio conventions:
masked kinetic type, clip-path image reveals, pinned scroll sequences, curtain
page transitions, magnetic CTAs and restrained smooth scrolling. It is applied
through DRYCHEM's own story rather than copied effects. Once the video is
available, the timings, easings and transitions can be tuned against it. All
of them live in `src/lib/gsap.ts`, `src/lib/motion.ts` and the per-section
`useGSAP` blocks.
