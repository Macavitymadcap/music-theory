import { render } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import Button from "./Button";

describe("Button", () => {
  it("renders children", () => {
    const { getByText } = render(() => <Button>click me</Button>);
    expect(getByText("click me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handler = vi.fn();
    const { getByText } = render(() => <Button onClick={handler}>go</Button>);
    getByText("go").click();
    expect(handler).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is set", () => {
    const { getByText } = render(() => <Button disabled>go</Button>);
    expect(getByText("go")).toBeDisabled();
  });

  it("applies variant class", () => {
    const { getByText } = render(() => <Button variant="danger">del</Button>);
    expect(getByText("del")).toHaveClass("btn--danger");
  });
});