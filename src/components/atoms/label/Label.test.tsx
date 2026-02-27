import { render } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import Label from "./Label";

describe("Label", () => {
  it("renders children", () => {
    const { getByText } = render(() => <Label>tempo</Label>);
    expect(getByText("tempo")).toBeInTheDocument();
  });

  it("renders a label element", () => {
    const { container } = render(() => <Label>tempo</Label>);
    expect(container.querySelector("label")).toBeInTheDocument();
  });

  it("sets the for attribute when provided", () => {
    const { container } = render(() => <Label for="bpm-input">bpm</Label>);
    expect(container.querySelector("label")).toHaveAttribute("for", "bpm-input");
  });

  it("applies the label class", () => {
    const { container } = render(() => <Label>test</Label>);
    expect(container.querySelector("label")).toHaveClass("label");
  });
});