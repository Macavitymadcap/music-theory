import type { Component, JSX } from "solid-js";
import "./Field.css";

interface FieldProps {
  children: JSX.Element;
}

const Field: Component<FieldProps> = (props) => {
  return <div class="field">{props.children}</div>;
};

export default Field;