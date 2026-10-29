/**
 * Page-reveal signal.
 *
 * Entrance animations must wait until the page is actually visible: after the
 * preloader opens on a hard load, or after the curtain lifts on a client-side
 * navigation. Components subscribe with `onPageReveal`; the preloader and the
 * transition curtain call `markPageRevealed`.
 */

type Listener = () => void;

let revealed = false;
const listeners = new Set<Listener>();

export function markPageRevealed() {
  revealed = true;
  const pending = [...listeners];
  listeners.clear();
  pending.forEach((fn) => fn());
}

export function resetPageRevealed() {
  revealed = false;
}

/** Runs `fn` once the page is revealed (immediately if it already is). Returns an unsubscribe. */
export function onPageReveal(fn: Listener): () => void {
  if (revealed) {
    fn();
    return () => {};
  }
  listeners.add(fn);
  return () => listeners.delete(fn);
}
