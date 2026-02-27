import { render } from "solid-js/web";
import "./styles/tokens.css";
import App from "./App"

const root = document.getElementById("app");
if (!root) throw new Error("No #app element found");

render(() => <App />, root);