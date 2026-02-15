export {
  type Note,
  type NoteName,
  NOTE_NAMES,
  NOTE_FREQUENCIES,
  TOTAL_SEMITONES,
  getFrequencyFromName,
  getFrequencyFromTonicAndInterval,
  createNote,
} from "./notes";

export {
  BREVE,
  SEMIBREVE,
  MINIM,
  CROTCHET,
  QUAVER,
  SEMIQUAVER,
  DEMISEMIQUAVER,
  HEMIDEMISEMIQUAVER,
  QUASIHEMIDEMISEMIQUAVER,
  FOUR_FOUR,
  THREE_FOUR,
} from "./duration";

export {
  type Scale,
  type ScaleName,
  type ScaleGroup,
  SCALES,
  SCALE_GROUPS,
  createScale,
  createScaleNotes,
  createScaleFromNoteName,
} from "./scales";

export {
  type Chord,
  type ChordType,
  type ChordGroup,
  CHORD_INTERVALS,
  CHORD_GROUPS,
  CHORD_DISPLAY_NAMES,
  createChord,
  createChordFromIntervals,
  createChordFromNoteName,
} from "./chords";

export {
  type WaveformType,
  scheduleNote,
  scheduleChord,
  playScale,
  playChord,
  playChordProgression,
  chainNodes,
} from "./web-audio";