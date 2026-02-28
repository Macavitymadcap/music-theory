/**
 * ScaleDegrees.tsx — Diatonic scale degree reference.
 *
 * Shows for each degree:
 *  - Roman numeral
 *  - Degree name (Tonic, Supertonic, etc.)
 *  - Triad quality in major vs natural minor
 *  - Harmonic function (tonic / subdominant / dominant / leading)
 *  - Semitones above tonic
 *  - Common chords built on that degree (in C)
 */

import { For } from "solid-js";
import { SCALE_DEGREES } from "../../../lib/cheat-sheets";
import "./ScaleDegrees.css";

const QUALITY_LABELS: Record<string, string> = {
  major: "maj",
  minor: "min",
  diminished: "dim",
  augmented: "aug",
};

const QUALITY_CLASS: Record<string, string> = {
  major: "scale-degrees__quality--major",
  minor: "scale-degrees__quality--minor",
  diminished: "scale-degrees__quality--dim",
  augmented: "scale-degrees__quality--aug",
};

const FUNCTION_CLASS: Record<string, string> = {
  tonic: "scale-degrees__fn--tonic",
  subdominant: "scale-degrees__fn--subdominant",
  dominant: "scale-degrees__fn--dominant",
  leading: "scale-degrees__fn--leading",
};

/** Example chords built in C major / C minor */
const EXAMPLE_IN_C: Record<string, { major: string; minor: string }> = {
  "I":    { major: "C",    minor: "Cm"   },
  "ii":   { major: "Dm",   minor: "D°"   },
  "iii":  { major: "Em",   minor: "Eb"   },
  "IV":   { major: "F",    minor: "Fm"   },
  "V":    { major: "G",    minor: "G"    },
  "vi":   { major: "Am",   minor: "Ab"   },
  "vii°": { major: "B°",   minor: "Bb"   },
};

export default function ScaleDegrees() {
  return (
    <div class="scale-degrees">
      <section class="scale-degrees__table-wrap" aria-label="Scale degrees reference">
        <table class="scale-degrees__table">
          <thead>
            <tr>
              <th scope="col">Degree</th>
              <th scope="col">Name</th>
              <th scope="col">Semitones</th>
              <th scope="col">Major key</th>
              <th scope="col">Minor key</th>
              <th scope="col">Function</th>
              <th scope="col">In C major</th>
              <th scope="col">In C minor</th>
            </tr>
          </thead>
          <tbody>
            <For each={SCALE_DEGREES}>
              {(deg) => (
                <tr class={`scale-degrees__row scale-degrees__row--fn-${deg.function}`}>
                  <td class="scale-degrees__roman">{deg.roman}</td>
                  <td class="scale-degrees__name">{deg.name}</td>
                  <td class="scale-degrees__semitones">{deg.semitones}</td>
                  <td>
                    <span class={`scale-degrees__quality ${QUALITY_CLASS[deg.majorQuality]}`}>
                      {QUALITY_LABELS[deg.majorQuality]}
                    </span>
                  </td>
                  <td>
                    <span class={`scale-degrees__quality ${QUALITY_CLASS[deg.minorQuality]}`}>
                      {QUALITY_LABELS[deg.minorQuality]}
                    </span>
                  </td>
                  <td>
                    <span class={`scale-degrees__fn ${FUNCTION_CLASS[deg.function]}`}>
                      {deg.function}
                    </span>
                  </td>
                  <td class="scale-degrees__example">{EXAMPLE_IN_C[deg.roman]?.major ?? "—"}</td>
                  <td class="scale-degrees__example">{EXAMPLE_IN_C[deg.roman]?.minor ?? "—"}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </section>

      {/* Function colour key */}
      <div class="scale-degrees__legend" aria-label="Function colour key">
        {(["tonic","subdominant","dominant","leading"] as const).map((fn) => (
          <span class={`scale-degrees__legend-item scale-degrees__legend-item--${fn}`}>
            {fn}
          </span>
        ))}
      </div>
    </div>
  );
}