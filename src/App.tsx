import type { Component } from "solid-js";
import { AudioProvider } from "./context/AudioContext";
import { PlaybackProvider } from "./context/PlaybackContext";
import ModeShell from "./components/organisms/mode-shell/ModeShell";
import "./styles/tokens.css";
import "./style.css";

const App: Component = () => (
  <AudioProvider>
    <PlaybackProvider>
      <header>
        <h1>music theory</h1>
        <p>notes, scales, chords &amp; progressions</p>
      </header>
      <main style={{ "margin-top": "2rem" }}>
        <ModeShell />
      </main>
    </PlaybackProvider>
  </AudioProvider>
);

export default App;