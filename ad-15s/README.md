# 15-second premium product ad

`premium_ad_15s.mp4`: 1080×1920 (9:16), 30 fps, exactly 15.000 s (450 frames), H.264 High, CRF 14 + AAC 320 kbps 48 kHz stereo, −16 LUFS integrated, −1.0 dBFS peak.

Every product pixel comes from the supplied source clip (720×1280, 9.5 s). Nothing about the product was generated, redrawn or invented.

## Product analysis (from the source footage)

| Source shot | Frames | Content |
|---|---|---|
| Box | 0–99 | Kraft paper box with a clear window. Mini tart cups are visible through it, then the lid opens. |
| Break | 111–202 | A gloved hand breaks a cup open, showing a glossy light filling and a darker swirled center. |
| Stack | 221–284 | Stacked cups with a two-tone swirled filling and a crumbly golden crust. Slow push-in, warm bokeh background. |

There is no logo, brand name or readable text anywhere in the footage. The ad therefore shows no logo and makes no claims. The only words used are visual descriptions ("Crust", "Swirled center", "Every layer, revealed.") and a generic CTA ("Discover more").

## Storyboard

| Time | Scene | What happens |
|---|---|---|
| 0.00–2.00 | Hook | Black frame. An anamorphic glint lands with a deep boom at 0.33 s. A spotlight opens onto a macro of the real swirled filling, with a slow push-in, a light sweep and sparse dust in a volumetric beam. |
| 2.00–5.00 | Reveal | A continuous pull-back from the macro to the full stack, with a slight roll to suggest an orbit. The product dims to a silhouette while a gold line traces its real outline (taken from the segmentation mask) and a plinth ellipse draws on. Light then rises inside the outline, with a warm rim light and a second sweep. |
| 5.00–9.00 | 3D experience | A whip-pan to the packaging, levelled, relit and given a light sweep. The camera pushes through the window (zoom blur) and lands on the real break-open. Tracked callouts follow: a reticle on the swirled center and leaders labelled "SWIRLED CENTER" and "CRUST". |
| 9.00–12.00 | Hero | A whip-pan into the stack with a speed ramp (fast to slow motion), a hero light sweep and the headline "EVERY LAYER, / REVEALED." timed to the beat. |
| 12.00–15.00 | Finale | The headline hands off to the end frame: a held hero composition with a slow push, a final light sweep and "DISCOVER MORE" with a gold rule. The music resolves and the last frame stays on screen. |

The score runs at 120 bpm, so every scene boundary (2, 5, 9 and 12 s) lands on a beat.

## Technique, and what was deliberately *not* done

- **Tracking and stabilisation.** Each shot is tracked (ORB features with a RANSAC similarity fit). A virtual camera then moves over the stabilised plate, so all graphics stay locked to the product. The camera path is clamped so it never leaves the real frame, then smoothed so there is no jitter.
- **Relighting (2.5D).** A product mask is generated per frame (rembg / ISNet), averaged across the shot in stabilised space so it can't flicker, and blurred. It is used only as a *lighting weight*: the background falls to near-black while the product keeps its original pixels. The product is never cut out.
- **Grading and finishing.** Warm filmic grade, highlight roll-off, bloom, light sharpening and fine grain.
- **No exploded view or internal mechanism.** The source shows no internal parts, so animating them would mean inventing them. The real break-open is the only interior shown.
- **No logo or claims.** None exist in the source. If you have a brand mark, add it to the final 2 s, centred above the CTA at about y = 1250–1350.
- **Resolution.** The source is 720p, so the master is 1080×1920. A 4K upscale would add no real detail.
- **Original audio dropped.** Its licensing is unknown. The music and all effects (booms, whooshes, ticks, metallic accents, riser) are synthesised from scratch in `pipeline/audio.py`, so no third-party samples are used.

## Rebuild

```bash
pip install "rembg[cpu]" opencv-python-headless scipy pillow numpy
mkdir -p src/f masks out frames
ffmpeg -i <source.mov> -vf fps=30 -start_number 0 src/f/%03d.png
python3 pipeline/track.py      # -> tracks.json
python3 pipeline/masks.py      # -> masks/
python3 pipeline/render.py campath   # -> campath.json (smoothed camera)
python3 pipeline/render.py full | ffmpeg -f rawvideo -pix_fmt rgb24 -s 1080x1920 -r 30 -i - \
  -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p out/video_noaudio.mp4
python3 pipeline/audio.py      # -> out/score.wav
ffmpeg -i out/video_noaudio.mp4 -i out/score.wav -map 0:v -map 1:a -c:v copy \
  -c:a aac -b:a 320k -t 15 -movflags +faststart premium_ad_15s.mp4
```

Run the scripts from the working folder that contains `src/`, `masks/` and `out/`. Copy `tracks.json` and `campath.json` there, or regenerate them.
