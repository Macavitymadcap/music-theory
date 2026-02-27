import { render } from "@solidjs/testing-library";
import { describe, it, expect } from "vitest";
import PianoKey from "./PianoKey";

describe("PianoKey", () => {
  it("renders a white key without active class", () => {
    const { container } = render(() => (
      <PianoKey midi={60} isBlack={false} isActive={false} />
    ));
    const key = container.querySelector(".piano-key");
    expect(key).toHaveClass("piano-key--white");
    expect(key).not.toHaveClass("piano-key--active");
  });

  it("renders a black key with correct class", () => {
    const { container } = render(() => (
      <PianoKey midi={61} isBlack={true} isActive={false} leftPercent={10} />
    ));
    expect(container.querySelector(".piano-key")).toHaveClass("piano-key--black");
  });

  it("applies active class when isActive is true", () => {
    const { container } = render(() => (
      <PianoKey midi={60} isBlack={false} isActive={true} />
    ));
    expect(container.querySelector(".piano-key")).toHaveClass("piano-key--active");
  });

  it("sets title attribute for tooltip", () => {
    const { container } = render(() => (
      <PianoKey midi={69} isBlack={false} isActive={false} />
    ));
    expect(container.querySelector(".piano-key")).toHaveAttribute("title", "A4");
  });

  it("shows octave marker on C keys", () => {
    const { container } = render(() => (
      <PianoKey midi={60} isBlack={false} isActive={false} />
    ));
    expect(container.querySelector(".piano-key__octave-marker")).toHaveTextContent("C4");
  });

  it("does not show octave marker on non-C white keys", () => {
    const { container } = render(() => (
      <PianoKey midi={62} isBlack={false} isActive={false} />
    ));
    expect(container.querySelector(".piano-key__octave-marker")).not.toBeInTheDocument();
  });

  it("applies left style to black keys", () => {
    const { container } = render(() => (
      <PianoKey midi={61} isBlack={true} isActive={false} leftPercent={12.5} />
    ));
    const key = container.querySelector<HTMLElement>(".piano-key");
    expect(key?.style.left).toBe("12.5%");
  });
});