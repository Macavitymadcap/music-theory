import type { Component, JSX } from "solid-js";
import "./Label.css";

interface LabelProps {
  for?: string;
  children: JSX.Element;
}

const Label: Component<LabelProps> = (props) => {
  return <label class="label" for={props.for}>{props.children}</label>;
};

export default Label;