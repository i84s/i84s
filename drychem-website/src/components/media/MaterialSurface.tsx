"use client";

import { useEffect, useRef, type RefObject } from "react";
import { mq } from "@/lib/motion";
import { fragmentShader, vertexShader } from "./surfaceShader";

/** Mutable state read every frame — tween it with GSAP. */
export type SurfaceState = {
  /** 1 = raw plaster, 0 = finished putty (intro). */
  rough: number;
  /** 0..1 scroll-driven finishing; pushes roughness to ~0 and dims. */
  finish: number;
  exposure: number;
  /** Laser draw progress, 0..1. */
  line: number;
  /** Laser height, 0..1 from the bottom. */
  lineY: number;
  /** Whether the surface is on screen (set by the parent's scroll logic). */
  active: boolean;
};

type Props = { stateRef: RefObject<SurfaceState>; className?: string; onReady?: () => void };

function readAccent(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--brand-primary").trim();
  const hex = raw.match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return [0.78, 0.7, 0.55];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[MaterialSurface] shader compile failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * Real-time raking-light render of a wall surface (WebGL 1, no libraries).
 * Renders at reduced resolution, adapts quality to frame time, pauses when
 * off screen or the tab is hidden, and switches to occasional still frames
 * for reduced motion, software-only WebGL, or devices that can't keep up.
 * Falls back to the poster behind it if WebGL is unavailable.
 */
export function MaterialSurface({ stateRef, className, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, vertexShader);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentShader);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[MaterialSurface] program link failed:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uni = {
      res: u("uRes"),
      scale: u("uScale"),
      time: u("uTime"),
      light: u("uLight"),
      rough: u("uRough"),
      exposure: u("uExposure"),
      line: u("uLine"),
      lineY: u("uLineY"),
      accent: u("uAccent"),
    };
    gl.uniform3fv(uni.accent, readAccent());

    const reduce = window.matchMedia(mq.reduce).matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // Without a GPU (blocklisted drivers, VMs) WebGL runs on the CPU. A continuous loop
    // would block the main thread there, so those devices get still frames instead.
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : "";
    let still = reduce || /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
    // Device px per CSS px for the drawing buffer. Kept modest: the surface is soft by design.
    let quality = still ? 0.4 : coarse ? 0.55 : 0.75;
    const maxScale = Math.min(window.devicePixelRatio || 1, 1.5);
    let scale = maxScale * quality;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      scale = maxScale * quality;
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const pointer = { x: 0.74, y: 0.74 };
    const light = { x: 0.74, y: 0.74 };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = 0.6 + ((e.clientX - rect.left) / rect.width) * 0.32;
      pointer.y = 0.6 + (1 - (e.clientY - rect.top) / rect.height) * 0.3;
    };

    let frame = 0;
    let ready = false;
    let visible = !document.hidden;
    const start = performance.now();
    let samples = 0;
    let sampleStart = 0;
    let lastDraw = 0;
    // The light drifts slowly, so touch devices render at ~30 fps to save battery and GPU.
    const frameInterval = coarse ? 1000 / 30 : 0;
    // Nothing worth drawing once the next chapter has (almost) covered the surface.
    const running = () => visible && state.active && state.finish < 0.9;

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const drift = still ? 0 : 1;
      light.x += (pointer.x + Math.sin(t * 0.13) * 0.05 * drift - light.x) * 0.045;
      light.y += (pointer.y + Math.cos(t * 0.1) * 0.035 * drift - light.y) * 0.045;
      const rough = state.rough + (0.03 - state.rough) * state.finish;
      gl.uniform2f(uni.res, canvas.width, canvas.height);
      gl.uniform1f(uni.scale, scale);
      gl.uniform1f(uni.time, t);
      gl.uniform2f(uni.light, light.x, light.y);
      gl.uniform1f(uni.rough, rough);
      gl.uniform1f(uni.exposure, state.exposure * (1 - 0.5 * state.finish));
      gl.uniform1f(uni.line, state.line);
      gl.uniform1f(uni.lineY, state.lineY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!ready) {
        ready = true;
        canvas.dataset.ready = "true";
        onReadyRef.current?.();
      }
    };

    const loop = (now: number) => {
      frame = 0;
      if (!running()) return;
      if (now - lastDraw < frameInterval - 2) {
        frame = requestAnimationFrame(loop);
        return;
      }
      lastDraw = now;
      const before = performance.now();
      draw(now);
      // Adaptive quality: if the first frames are slow, render fewer pixels.
      if (samples < 45) {
        if (samples === 5) sampleStart = before;
        samples++;
        if (samples === 45) {
          const avg = (performance.now() - sampleStart) / 40;
          if (avg > 24 && quality > 0.4) {
            quality = Math.max(0.4, quality * 0.7);
            resize();
            samples = 0; // measure again at the lower resolution
          } else if (avg > 40) {
            still = true; // still too slow at the lowest resolution: stop animating
            return;
          }
        }
      }
      frame = requestAnimationFrame(loop);
    };

    let drawnKey = "";
    const stateKey = () =>
      [state.rough, state.finish, state.exposure, state.line, state.lineY].map((v) => Number(v).toFixed(2)).join("|");
    const kick = () => {
      if (still) {
        // Still frames: redraw (at most every poll) only when the parent changed the state.
        if (visible && stateKey() !== drawnKey) {
          drawnKey = stateKey();
          draw(performance.now());
        }
        return;
      }
      if (!frame && running()) frame = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (still || !frame) draw(performance.now());
    });
    ro.observe(canvas);

    const onVisibility = () => {
      visible = !document.hidden;
      kick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });

    // The parent toggles `state.active` / `state.finish`; poll cheaply so the loop restarts when needed
    // (and, in still mode, so state changes are redrawn a few times per second at most).
    const activity = window.setInterval(kick, 250);

    kick();

    const onLost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(activity);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [stateRef]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
