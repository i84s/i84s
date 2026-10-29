"use client";

import { gsap } from "@/lib/gsap";

/**
 * Idle-time task queue.
 *
 * Animation set-up for content below the fold (SplitText measuring, dozens of
 * ScrollTriggers) doesn't need to run during hydration. Queued tasks run in
 * order when the main thread is idle, a few per idle period, so the work is
 * split into short tasks instead of one long one. The preloader or page
 * curtain is still covering the page while they run.
 */

type Task = () => void;
type Deadline = { timeRemaining: () => number; didTimeout: boolean };

const queue: Task[] = [];
let scheduled = false;

const requestIdle = (cb: (deadline: Deadline) => void) => {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(cb, { timeout: 700 });
  else setTimeout(() => cb({ timeRemaining: () => 8, didTimeout: true }), 16);
};

function flush(deadline: Deadline) {
  scheduled = false;
  // Always make progress; otherwise keep going while the idle period lasts.
  do {
    queue.shift()?.();
  } while (queue.length && deadline.timeRemaining() > 6);
  if (queue.length) schedule();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestIdle(flush);
}

/** Runs `task` when the main thread is idle (tasks keep their order). Returns a cancel function. */
export function whenIdle(task: Task): () => void {
  queue.push(task);
  schedule();
  return () => {
    const index = queue.indexOf(task);
    if (index >= 0) queue.splice(index, 1);
  };
}

/**
 * `gsap.matchMedia()` whose set-up runs when the main thread is idle (or right
 * away with `defer: false`). Returns the cleanup for a `useGSAP` callback.
 */
export function idleMatchMedia(setup: (mm: gsap.MatchMedia) => void, { defer = true }: { defer?: boolean } = {}) {
  let mm: gsap.MatchMedia | undefined;
  const run = () => {
    mm = gsap.matchMedia();
    setup(mm);
  };
  let cancel = () => {};
  if (defer) cancel = whenIdle(run);
  else run();
  return () => {
    cancel();
    mm?.revert();
  };
}
