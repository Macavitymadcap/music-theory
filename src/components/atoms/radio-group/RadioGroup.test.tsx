import { render, fireEvent } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import RadioGroup from "./RadioGroup";

const opts = [
  { value: "note", label: "note" },
  { value: "scale", label: "scale" },
];

describe("RadioGroup", () => {
  it("renders all options", () => {
    const { getByLabelText } = render(() => (
      <RadioGroup name="mode" options={opts} value="note" onChange={() => {}} />
    ));
    expect(getByLabelText("note")).toBeInTheDocument();
    expect(getByLabelText("scale")).toBeInTheDocument();
  });

  it("marks the current value as checked", () => {
    const { getByLabelText } = render(() => (
      <RadioGroup name="mode" options={opts} value="scale" onChange={() => {}} />
    ));
    expect(getByLabelText("scale")).toBeChecked();
    expect(getByLabelText("note")).not.toBeChecked();
  });

  it("calls onChange with the new value", () => {
    const handler = vi.fn();
    const { getByLabelText } = render(() => (
      <RadioGroup name="mode" options={opts} value="note" onChange={handler} />
    ));
    fireEvent.click(getByLabelText("scale"));
    expect(handler).toHaveBeenCalledWith("scale");
  });
});