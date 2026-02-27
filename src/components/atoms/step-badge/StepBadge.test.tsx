import { render } from "@solidjs/testing-library";
import { describe, it, expect, vi } from "vitest";
import StepBadge from "./StepBadge";

describe("StepBadge", () => {
  it("renders degree, chord and bars", () => {
    const { getByText } = render(() => (
      <StepBadge label="I" chord="Major" bars={2} />
    ));
    expect(getByText("I")).toBeInTheDocument();
    expect(getByText("Major")).toBeInTheDocument();
    expect(getByText("2b")).toBeInTheDocument();
  });

  it("shows remove button when onRemove is provided", () => {
    const { getByLabelText } = render(() => (
      <StepBadge label="I" chord="Major" bars={1} onRemove={() => {}} />
    ));
    expect(getByLabelText("remove step")).toBeInTheDocument();
  });

  it("does not show remove button when onRemove is absent", () => {
    const { queryByLabelText } = render(() => (
      <StepBadge label="I" chord="Major" bars={1} />
    ));
    expect(queryByLabelText("remove step")).not.toBeInTheDocument();
  });

  it("calls onRemove when remove button is clicked", () => {
    const handler = vi.fn();
    const { getByLabelText } = render(() => (
      <StepBadge label="I" chord="Major" bars={1} onRemove={handler} />
    ));
    getByLabelText("remove step").click();
    expect(handler).toHaveBeenCalledOnce();
  });
});