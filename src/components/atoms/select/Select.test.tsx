import { render, fireEvent } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import Select from "./Select";

const opts = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

describe("Select", () => {
  it("renders all options", () => {
    const { getByText } = render(() => (
      <Select value="a" onChange={() => {}} options={opts} />
    ));
    expect(getByText("Option A")).toBeInTheDocument();
    expect(getByText("Option B")).toBeInTheDocument();
  });

  it("calls onChange with the selected value", () => {
    const handler = vi.fn();
    const { getByRole } = render(() => (
      <Select value="a" onChange={handler} options={opts} />
    ));
    fireEvent.change(getByRole("combobox"), { target: { value: "b" } });
    expect(handler).toHaveBeenCalledWith("b");
  });

  it("renders optgroups when groups prop is provided", () => {
    const groups = [{ label: "Group 1", options: opts }];
    const { container } = render(() => (
      <Select value="a" onChange={() => {}} groups={groups} />
    ));
    expect(container.querySelector("optgroup")).toBeInTheDocument();
  });
});