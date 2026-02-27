import { describe, it, expect } from "vitest";
import { createScale, SCALES } from "./scales";

describe("createScale", () => {
  it("returns the correct number of notes for the major scale", () => {
    // Arrange
    const majorScale = "major"
    const c4 = 261.63;
    
    // Act
    const notes = createScale(majorScale, c4);

    // Assert
    expect(notes).toHaveLength(SCALES.major.length);
  });

  it("returns notes with positive frequencies", () => {
    // Arrange
    const majorScale = "major"
    const c4 = 261.63;
    
    // Act
    const notes = createScale(majorScale, c4);

    // Assert
    notes.forEach((n) => expect(n.frequency).toBeGreaterThan(0));
  });

  it("first note frequency matches the tonic", () => {
    // Arrange
    const majorScale = "major"
    const c4 = 261.63;
    
    // Act
    const notes = createScale(majorScale, c4);

    // Assert
    expect(notes[0].frequency).toBeCloseTo(c4);
  });
});