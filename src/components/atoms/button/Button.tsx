import type { Component, JSX } from "solid-js";
import "./Button.css";

export type ButtonVariant = "primary" | "danger" | "ghost";

interface ButtonProps {
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  children: JSX.Element;
}

const Button: Component<ButtonProps> = (props) => {
  return (
    <button
      type={props.type ?? "button"}
      class={`btn btn--${props.variant ?? "primary"}`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.children}
    </button>
  );
};

export default Button;