/** Note duration values as fractions of a whole note (semibreve) */
export const DURATIONS = {
  BREVE: 2,
  SEMIBREVE: 1,
  MINIM: 0.5,
  CROTCHET: 0.25,
  QUAVER: 0.125,
  SEMIQUAVER: 0.0625,
  DEMISEMIQUAVER: 0.03125,
  HEMIDEMISEMIQUAVER: 0.015625,
  QUASIHEMIDEMISEMIQUAVER: 0.0078125,
} as const;

export type Duration = (typeof DURATIONS)[keyof typeof DURATIONS];


/** Time signatures as beats per measure */
export const TIME_SIGNATURES = {
  FOUR_FOUR: 4,
  THREE_FOUR: 3
} as const;

export type TimeSignature = (typeof TIME_SIGNATURES)[keyof typeof TIME_SIGNATURES]