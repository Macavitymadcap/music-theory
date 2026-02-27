import type { Component, JSX } from "solid-js";
import "./Row.css";

interface RowProps {
  children: JSX.Element;
}

const Row: Component<RowProps> = (props) => (
  <div class="row">{props.children}</div>
);

export default Row;