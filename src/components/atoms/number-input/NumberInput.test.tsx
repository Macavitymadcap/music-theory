import { render, fireEvent } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import NumberInput from "./NumberInput";

describe("NumberInput", () => {
  it("renders with the given value", () => {
    const { getByRole } = render(() => (
      <NumberInput value={120} onChange={() => {}} />
    ));
    expect(getByRole("spinbutton")).toHaveValue(120);
  });

  it("calls onChange with parsed integer on input", () => {
    const handler = vi.fn();
    const { getByRole } = render(() => (
      <NumberInput value={120} onChange={handler} />
    ));
    fireEvent.input(getByRole("spinbutton"), { target: { value: "140" } });
    expect(handler).toHaveBeenCalledWith(140);
  });

  it("does not call onChange for non-numeric input", () => {
    const handler = vi.fn();
    const { getByRole } = render(() => (
      <NumberInput value={120} onChange={handler} />
    ));
    fireEvent.input(getByRole("spinbutton"), { target: { value: "abc" } });
    expect(handler).not.toHaveBeenCalled();
  });

  it("respects min and max attributes", () => {
    const { getByRole } = render(() => (
      <NumberInput value={5} onChange={() => {}} min={1} max={10} />
    ));
    const input = getByRole("spinbutton");
    expect(input).toHaveAttribute("min", "1");
    expect(input).toHaveAttribute("max", "10");
  });
});