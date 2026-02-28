/**
 * IntervalReference.tsx — Visual reference table of all 13 intervals.
 *
 * - Shows semitone count, short name, full name, quality, example, consonance
 * - Rows colour-coded by consonance: perfect (green), imperfect (amber), dissonant (muted)
 * - Semitone bar visualisation for quick visual comparison
 */

import { For } from "solid-js";
import { INTERVALS } from "../../lib/cheat-sheets";

function consonanceClass(c: string): string {
  if (c === "perfect") return "interval-ref__row--perfect";
  if (c === "imperfect") return "interval-ref__row--imperfect";
  return "interval-ref__row--dissonant";
}

export default function IntervalReference() {
  return (
    <div class="interval-ref">
      <div class="interval-ref__legend" aria-hidden="true">
        <span class="interval-ref__legend-item interval-ref__legend-item--perfect">Perfect</span>
        <span class="interval-ref__legend-item interval-ref__legend-item--imperfect">Imperfect</span>
        <span class="interval-ref__legend-item interval-ref__legend-item--dissonant">Dissonant</span>
      </div>

      <section class="interval-ref__table-wrap" aria-label="Interval reference table">
        <table class="interval-ref__table">
          <thead>
            <tr>
              <th scope="col">St</th>
              <th scope="col">Short</th>
              <th scope="col">Name</th>
              <th scope="col">Example</th>
              <th scope="col" aria-label="Semitone bar">Size</th>
            </tr>
          </thead>
          <tbody>
            <For each={INTERVALS}>
              {(interval) => (
                <tr class={`interval-ref__row ${consonanceClass(interval.consonance)}`}>
                  <td class="interval-ref__semitones">{interval.semitones}</td>
                  <td class="interval-ref__short">{interval.shortName}</td>
                  <td class="interval-ref__name">{interval.fullName}</td>
                  <td class="interval-ref__example">{interval.example}</td>
                  <td class="interval-ref__bar-cell">
                    <div
                      class="interval-ref__bar"
                      aria-hidden="true"
                      style={{ width: `${(interval.semitones / 12) * 100}%` }}
                    />
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </section>
    </div>
  );
}