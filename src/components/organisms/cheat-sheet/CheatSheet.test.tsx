/**
 * cheat-sheets.test.ts — Unit tests for src/lib/cheat-sheets.ts
 *
 * Verifies data integrity:
 *  - CIRCLE_OF_FIFTHS: 12 entries, unique names, angles, accidentals
 *  - KEY_SIGNATURES: 12 entries, correct sharp/flat counts, scale lengths
 *  - INTERVALS: 13 entries, semitone 0–12, unique shortNames
 *  - SCALE_DEGREES: 7 entries, semitones correct, roman numerals
 *  - TREBLE/BASS note arrays: lengths, positions, mnemonics
 *  - CHORD_FORMULAS: lengths, semitone arrays
 */

import { describe, it, expect } from "vitest";
import { CIRCLE_OF_FIFTHS, KEY_SIGNATURES, INTERVALS, SCALE_DEGREES, TREBLE_LINES, TREBLE_SPACES, BASS_LINES, BASS_SPACES, CHORD_FORMULAS } from "../../../lib/cheat-sheets";


// ---------------------------------------------------------------------------
// CIRCLE_OF_FIFTHS
// ---------------------------------------------------------------------------

describe("CIRCLE_OF_FIFTHS", () => {
  it("has exactly 12 entries", () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(12);
  });

  it("all entries have name, major, minor, accidentals, accidentalType, angle", () => {
    for (const key of CIRCLE_OF_FIFTHS) {
      expect(typeof key.name).toBe("string");
      expect(typeof key.major).toBe("string");
      expect(typeof key.minor).toBe("string");
      expect(typeof key.accidentals).toBe("number");
      expect(["sharp", "flat", "none"]).toContain(key.accidentalType);
      expect(typeof key.angle).toBe("number");
    }
  });

  it("key names are unique", () => {
    const names = CIRCLE_OF_FIFTHS.map((k) => k.name);
    expect(new Set(names).size).toBe(12);
  });

  it("angles span 0–330 in 30° steps", () => {
    const angles = CIRCLE_OF_FIFTHS.map((k) => k.angle).sort((a, b) => a - b);
    expect(angles).toEqual([0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]);
  });

  it("C has 0 accidentals and type 'none'", () => {
    const c = CIRCLE_OF_FIFTHS.find((k) => k.name === "C");
    expect(c).toBeDefined();
    expect(c!.accidentals).toBe(0);
    expect(c!.accidentalType).toBe("none");
  });

  it("G has 1 sharp", () => {
    const g = CIRCLE_OF_FIFTHS.find((k) => k.name === "G");
    expect(g!.accidentals).toBe(1);
    expect(g!.accidentalType).toBe("sharp");
  });

  it("F has 1 flat", () => {
    const f = CIRCLE_OF_FIFTHS.find((k) => k.name === "F");
    expect(f!.accidentals).toBe(1);
    expect(f!.accidentalType).toBe("flat");
  });

  it("accidental counts are non-negative and ≤ 6", () => {
    for (const key of CIRCLE_OF_FIFTHS) {
      expect(key.accidentals).toBeGreaterThanOrEqual(0);
      expect(key.accidentals).toBeLessThanOrEqual(6);
    }
  });

  it("C is at angle 0 (top of circle)", () => {
    const c = CIRCLE_OF_FIFTHS.find((k) => k.name === "C");
    expect(c!.angle).toBe(0);
  });

  it("F# / Db are at angle 180 (opposite C)", () => {
    const fsharp = CIRCLE_OF_FIFTHS.find((k) => k.name === "F#");
    const db = CIRCLE_OF_FIFTHS.find((k) => k.name === "Db");
    expect(fsharp!.angle).toBe(180);
    expect(db!.angle).toBe(210);
  });

  it("relative minors are non-empty strings", () => {
    for (const key of CIRCLE_OF_FIFTHS) {
      expect(key.minor.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// KEY_SIGNATURES
// ---------------------------------------------------------------------------

describe("KEY_SIGNATURES", () => {
  it("has exactly 15 entries", () => {
    expect(KEY_SIGNATURES).toHaveLength(15);
  });

  it("each has a key string and a 7-note scale", () => {
    for (const ks of KEY_SIGNATURES) {
      expect(typeof ks.key).toBe("string");
      expect(ks.scale).toHaveLength(7);
    }
  });

  it("each entry has either sharps or flats (not both)", () => {
    for (const ks of KEY_SIGNATURES) {
      expect(ks.sharps.length === 0 || ks.flats.length === 0).toBe(true);
    }
  });

  it("C major has no sharps or flats", () => {
    const c = KEY_SIGNATURES.find((k) => k.key === "C");
    expect(c!.sharps).toHaveLength(0);
    expect(c!.flats).toHaveLength(0);
  });

  it("G major has 1 sharp (F#)", () => {
    const g = KEY_SIGNATURES.find((k) => k.key === "G");
    expect(g!.sharps).toHaveLength(1);
    expect(g!.sharps[0]).toBe("F#");
  });

  it("F major has 1 flat (Bb)", () => {
    const f = KEY_SIGNATURES.find((k) => k.key === "F");
    expect(f!.flats).toHaveLength(1);
    expect(f!.flats[0]).toBe("Bb");
  });

  it("F# major has 6 sharps", () => {
    const fs = KEY_SIGNATURES.find((k) => k.key === "F#");
    expect(fs!.sharps).toHaveLength(6);
  });

  it("Db major has 5 flats", () => {
    const db = KEY_SIGNATURES.find((k) => k.key === "Db");
    expect(db!.flats).toHaveLength(5);
  });

  it("all scale notes are non-empty strings", () => {
    for (const ks of KEY_SIGNATURES) {
      for (const note of ks.scale) {
        expect(typeof note).toBe("string");
        expect(note.length).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// INTERVALS
// ---------------------------------------------------------------------------

describe("INTERVALS", () => {
  it("has exactly 13 entries (unison through octave)", () => {
    expect(INTERVALS).toHaveLength(13);
  });

  it("semitones run 0–12 in order", () => {
    const semitones = INTERVALS.map((i) => i.semitones);
    expect(semitones).toEqual([0,1,2,3,4,5,6,7,8,9,10,11,12]);
  });

  it("all shortNames are unique", () => {
    const shorts = INTERVALS.map((i) => i.shortName);
    expect(new Set(shorts).size).toBe(13);
  });

  it("all fullNames are non-empty strings", () => {
    for (const interval of INTERVALS) {
      expect(interval.fullName.length).toBeGreaterThan(0);
    }
  });

  it("consonance is one of 'perfect', 'imperfect', 'dissonant'", () => {
    const valid = new Set(["perfect", "imperfect", "dissonant"]);
    for (const interval of INTERVALS) {
      expect(valid.has(interval.consonance)).toBe(true);
    }
  });

  it("P1 (unison) is perfect consonance", () => {
    expect(INTERVALS[0].consonance).toBe("perfect");
    expect(INTERVALS[0].semitones).toBe(0);
  });

  it("P8 (octave) is perfect consonance", () => {
    expect(INTERVALS[12].consonance).toBe("perfect");
    expect(INTERVALS[12].semitones).toBe(12);
  });

  it("tritone (TT, 6 semitones) is dissonant", () => {
    const tt = INTERVALS.find((i) => i.semitones === 6);
    expect(tt!.consonance).toBe("dissonant");
  });

  it("P5 (7 semitones) is perfect", () => {
    const p5 = INTERVALS.find((i) => i.semitones === 7);
    expect(p5!.consonance).toBe("perfect");
  });

  it("all example strings are non-empty", () => {
    for (const interval of INTERVALS) {
      expect(interval.example.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// SCALE_DEGREES
// ---------------------------------------------------------------------------

describe("SCALE_DEGREES", () => {
  it("has exactly 7 entries", () => {
    expect(SCALE_DEGREES).toHaveLength(7);
  });

  it("degree numbers are 1–7", () => {
    const degrees = SCALE_DEGREES.map((d) => d.degree);
    expect(degrees).toEqual([1,2,3,4,5,6,7]);
  });

  it("semitones match major scale (W-W-H-W-W-W-H from 0)", () => {
    const expected = [0,2,4,5,7,9,11];
    expect(SCALE_DEGREES.map((d) => d.semitones)).toEqual(expected);
  });

  it("roman numerals are unique", () => {
    const romans = SCALE_DEGREES.map((d) => d.roman);
    expect(new Set(romans).size).toBe(7);
  });

  it("degree I (tonic) is 0 semitones", () => {
    const tonic = SCALE_DEGREES.find((d) => d.degree === 1);
    expect(tonic!.semitones).toBe(0);
    expect(tonic!.function).toBe("tonic");
  });

  it("degree V (dominant) is 7 semitones", () => {
    const dom = SCALE_DEGREES.find((d) => d.degree === 5);
    expect(dom!.semitones).toBe(7);
    expect(dom!.function).toBe("dominant");
  });

  it("degree IV (subdominant) is 5 semitones", () => {
    const sub = SCALE_DEGREES.find((d) => d.degree === 4);
    expect(sub!.semitones).toBe(5);
    expect(sub!.function).toBe("subdominant");
  });

  it("all functions are valid strings", () => {
    const valid = new Set(["tonic","subdominant","dominant","leading"]);
    for (const deg of SCALE_DEGREES) {
      expect(valid.has(deg.function)).toBe(true);
    }
  });

  it("all quality values are valid", () => {
    const valid = new Set(["major","minor","diminished","augmented"]);
    for (const deg of SCALE_DEGREES) {
      expect(valid.has(deg.majorQuality)).toBe(true);
      expect(valid.has(deg.minorQuality)).toBe(true);
    }
  });

  it("degree I is major quality in major, minor in natural minor", () => {
    const tonic = SCALE_DEGREES.find((d) => d.degree === 1)!;
    expect(tonic.majorQuality).toBe("major");
    expect(tonic.minorQuality).toBe("minor");
  });

  it("degree VII is diminished in major, major in natural minor", () => {
    const leading = SCALE_DEGREES.find((d) => d.degree === 7)!;
    expect(leading.majorQuality).toBe("diminished");
    expect(leading.minorQuality).toBe("major");
  });
});

// ---------------------------------------------------------------------------
// Staff note arrays (treble + bass)
// ---------------------------------------------------------------------------

describe("TREBLE_LINES", () => {
  it("has 5 entries", () => {
    expect(TREBLE_LINES).toHaveLength(5);
  });

  it("all are onLine=true", () => {
    for (const n of TREBLE_LINES) {
      expect(n.onLine).toBe(true);
    }
  });

  it("positions are 1–5", () => {
    expect(TREBLE_LINES.map((n) => n.position)).toEqual([1,2,3,4,5]);
  });

  it("spells EGBDF", () => {
    const letters = TREBLE_LINES.map((n) => n.note[0]);
    expect(letters).toEqual(["E","G","B","D","F"]);
  });

  it("has mnemonics", () => {
    for (const n of TREBLE_LINES) {
      expect(n.mnemonic).toBeTruthy();
    }
  });
});

describe("TREBLE_SPACES", () => {
  it("has 4 entries", () => {
    expect(TREBLE_SPACES).toHaveLength(4);
  });

  it("all are onLine=false", () => {
    for (const n of TREBLE_SPACES) {
      expect(n.onLine).toBe(false);
    }
  });

  it("spells FACE", () => {
    const letters = TREBLE_SPACES.map((n) => n.note[0]);
    expect(letters).toEqual(["F","A","C","E"]);
  });
});

describe("BASS_LINES", () => {
  it("has 5 entries", () => {
    expect(BASS_LINES).toHaveLength(5);
  });

  it("all are onLine=true", () => {
    for (const n of BASS_LINES) {
      expect(n.onLine).toBe(true);
    }
  });

  it("spells GBDFA", () => {
    const letters = BASS_LINES.map((n) => n.note[0]);
    expect(letters).toEqual(["G","B","D","F","A"]);
  });
});

describe("BASS_SPACES", () => {
  it("has 4 entries", () => {
    expect(BASS_SPACES).toHaveLength(4);
  });

  it("all are onLine=false", () => {
    for (const n of BASS_SPACES) {
      expect(n.onLine).toBe(false);
    }
  });

  it("spells ACEG", () => {
    const letters = BASS_SPACES.map((n) => n.note[0]);
    expect(letters).toEqual(["A","C","E","G"]);
  });
});

// ---------------------------------------------------------------------------
// CHORD_FORMULAS
// ---------------------------------------------------------------------------

describe("CHORD_FORMULAS", () => {
  it("has at least 10 entries", () => {
    expect(CHORD_FORMULAS.length).toBeGreaterThanOrEqual(10);
  });

  it("all have name, symbol, intervals, semitones, example", () => {
    for (const cf of CHORD_FORMULAS) {
      expect(typeof cf.name).toBe("string");
      expect(typeof cf.symbol).toBe("string");
      expect(typeof cf.intervals).toBe("string");
      expect(Array.isArray(cf.semitones)).toBe(true);
      expect(typeof cf.example).toBe("string");
    }
  });

  it("all semitone arrays start with 0 (tonic)", () => {
    for (const cf of CHORD_FORMULAS) {
      expect(cf.semitones[0]).toBe(0);
    }
  });

  it("semitones are ascending within each formula", () => {
    for (const cf of CHORD_FORMULAS) {
      for (let i = 1; i < cf.semitones.length; i++) {
        expect(cf.semitones[i]).toBeGreaterThan(cf.semitones[i - 1]);
      }
    }
  });

  it("major triad is [0, 4, 7]", () => {
    const major = CHORD_FORMULAS.find((c) => c.name === "Major");
    expect(major!.semitones).toEqual([0, 4, 7]);
  });

  it("minor triad is [0, 3, 7]", () => {
    const minor = CHORD_FORMULAS.find((c) => c.name === "Minor");
    expect(minor!.semitones).toEqual([0, 3, 7]);
  });

  it("dom 7th is [0, 4, 7, 10]", () => {
    const dom7 = CHORD_FORMULAS.find((c) => c.name === "Dom 7th");
    expect(dom7!.semitones).toEqual([0, 4, 7, 10]);
  });

  it("all names are unique", () => {
    const names = CHORD_FORMULAS.map((c) => c.name);
    expect(new Set(names).size).toBe(CHORD_FORMULAS.length);
  });
});