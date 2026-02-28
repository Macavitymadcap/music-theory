import { createSignal, For, Show } from "solid-js";
import { KEY_SIGNATURES } from "../../lib/cheat-sheets";
import Field from "../atoms/field/Field";
import Label from "../atoms/label/Label";
import RadioGroup from "../atoms/radio-group/RadioGroup";

const FILTERS = [
  { value: "all", label: "All keys" },
  { value: "sharps", label: "Sharps ♯" },
  { value: "flats", label: "Flats ♭" },
] as const;

export default function KeySignatures() {
  const [filter, setFilter] = createSignal<"all" | "sharps" | "flats">("all");

  const visible = () =>
    KEY_SIGNATURES.filter((k) => {
      if (filter() === "sharps") return k.sharps.length > 0;
      if (filter() === "flats") return k.flats.length > 0;
      return true;
    }).sort((a, b) => {
      // C first, then sharps ascending, then flats ascending
      if (a.sharps.length > 0 && b.sharps.length > 0)
        return a.sharps.length - b.sharps.length;
      if (a.flats.length > 0 && b.flats.length > 0)
        return a.flats.length - b.flats.length;
      if (a.sharps.length === 0 && a.flats.length === 0) return -1;
      if (b.sharps.length === 0 && b.flats.length === 0) return 1;
      if (a.sharps.length > 0) return -1;
      return 1;
    });

  return (
    <div class="key-signatures">
      <Field>
        <Label>Filter key signatures</Label>
        <RadioGroup
          name="key-signature-filter"
          options={[...FILTERS]}
          value={filter()}
          onChange={v => setFilter(v as "all" | "sharps" | "flats")}
        />
      </Field>

      <section class="key-signatures__table-wrap" aria-label="Key signatures table">
        <table class="key-signatures__table">
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Accidentals</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            <For each={visible()}>
              {(ks) => {
                const accList = ks.sharps.length > 0 ? ks.sharps : ks.flats;
                let accSymbol = "";
                if (ks.sharps.length > 0) {
                  accSymbol = "♯";
                } else if (ks.flats.length > 0) {
                  accSymbol = "♭";
                }
                const accCount = accList.length;

                return (
                  <tr class="key-signatures__row">
                    <td class="key-signatures__key">{ks.key}</td>
                    <td class="key-signatures__acc">
                      <Show when={accCount > 0} fallback={<span class="key-signatures__none">—</span>}>
                        <span class="key-signatures__acc-symbol">{accSymbol}{accCount}</span>
                        <span class="key-signatures__acc-list">
                          {accList.join(", ")}
                        </span>
                      </Show>
                    </td>
                    <td class="key-signatures__scale">
                      <For each={ks.scale}>
                        {(note, i) => (
                          <>
                            <span
                              class={`key-signatures__scale-note${
                                accList.includes(note) ? " key-signatures__scale-note--accidental" : ""
                              }`}
                            >
                              {note}
                            </span>
                            <Show when={i() < ks.scale.length - 1}>
                              <span class="key-signatures__dash"> – </span>
                            </Show>
                          </>
                        )}
                      </For>
                    </td>
                  </tr>
                );
              }}
            </For>
          </tbody>
        </table>
      </section>
    </div>
  );
}