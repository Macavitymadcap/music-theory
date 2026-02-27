import { render, cleanup } from "@solidjs/testing-library";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

vi.mock("../../../lib/notation", () => ({
  renderNotation: vi.fn(() => () => {}),
}));

import Notation from "./Notation";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe("Notation", () => {
  it("renders the container element", () => {
    const { container } = render(() => <Notation bars={[]} />);
    expect(container.querySelector(".notation")).toBeInTheDocument();
    expect(container.querySelector(".notation__container")).toBeInTheDocument();
  });

  it("renders the default label", () => {
    const { getByText } = render(() => <Notation bars={[]} />);
    expect(getByText("notation")).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    const { getByText } = render(() => <Notation bars={[]} label="scale" />);
    expect(getByText("scale")).toBeInTheDocument();
  });

  it("calls renderNotation when bars are provided", async () => {
    const { renderNotation } = await import("../../../lib/notation");
    vi.mocked(renderNotation).mockClear();
    const bars = [{ chords: [[440]], timeSignature: "4/4" }];
    render(() => <Notation bars={bars} />);
    // Flush the requestAnimationFrame callback
    await vi.runAllTimersAsync();
    expect(renderNotation).toHaveBeenCalled();
  });

  it("does not call renderNotation when bars is empty", async () => {
    const { renderNotation } = await import("../../../lib/notation");
    vi.mocked(renderNotation).mockClear();
    render(() => <Notation bars={[]} />);
    await vi.runAllTimersAsync();
    expect(renderNotation).not.toHaveBeenCalled();
  });
});