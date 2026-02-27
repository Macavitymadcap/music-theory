import { type Component, createEffect, onCleanup } from "solid-js";
import { renderNotation, type NotationBar } from "../../../lib/notation";
import "./Notation.css";

interface NotationProps {
  bars: NotationBar[];
  label?: string;
}

const Notation: Component<NotationProps> = (props) => {
  let container!: HTMLDivElement;
  let cleanup: (() => void) | null = null;
  let rafId: number | null = null;

  function cancelPending() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    cleanup?.();
    cleanup = null;
  }

  createEffect(() => {
    // Read bars inside effect to track reactivity
    const bars = props.bars;

    cancelPending();

    if (!bars.length) return;

    // Always defer rendering to the next animation frame.
    // This ensures the panel's own createEffect has already fired and
    // updated selectionFrequencies before we try to measure clientWidth.
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (!container) return;
      try {
        cleanup = renderNotation(container, bars, {
          width: container.clientWidth || 600,
        });
      } catch (e) {
        console.warn("Notation render error:", e);
      }
    });
  });

  onCleanup(cancelPending);

  return (
    <div class="notation">
      <span class="notation__label">{props.label ?? "notation"}</span>
      <div class="notation__container" ref={container} />
    </div>
  );
};

export default Notation;