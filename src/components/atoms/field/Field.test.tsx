import { render } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import Field from "./Field";

describe("Field", () => {
  it("renders children", () => {
    const { getByText } = render(() => <Field><span>content</span></Field>);
    expect(getByText("content")).toBeInTheDocument();
  });

  it("renders a div with the field class", () => {
    const { container } = render(() => <Field><span /></Field>);
    const div = container.querySelector("div");
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass("field");
  });

  it("renders multiple children", () => {
    const { getByText } = render(() => (
      <Field>
        <span>label</span>
        <span>input</span>
      </Field>
    ));
    expect(getByText("label")).toBeInTheDocument();
    expect(getByText("input")).toBeInTheDocument();
  });
});