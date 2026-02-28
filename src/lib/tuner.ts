/**
 * tuner.ts — Microphone-based pitch detection using autocorrelation.
 *
 * Uses the McLeod Pitch Method (MPM) variant of autocorrelation, which
 * normalises the signal and uses peak-picking to give stable results
 * across a wide dynamic range.
 *
 * Public API
 * ----------
 * startTuner(onResult, options?) → stopFn
 */

export interface TunerResult {
  note: string;   // e.g. "A"
  octave: number; // e.g. 4
  cents: number;  // deviation from equal temperament, −50 … +50
  frequency: number; // detected Hz
  targetFrequency: number; // nearest equal-temperament Hz
}

export interface TunerOptions {
  /** How often to poll the analyser, in milliseconds. Default: 80 */
  intervalMs?: number;
  /** Minimum RMS signal level to attempt detection (0–1). Default: 0.01 */
  minRms?: number;
  /** FFT size for the AnalyserNode. Default: 2048 */
  fftSize?: number;
}

const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

/**
 * Converts a frequency in Hz to the nearest MIDI note number.
 * MIDI 69 = A4 = 440 Hz.
 */
export function frequencyToMidiExact(hz: number): number {
  return 12 * Math.log2(hz / 440) + 69;
}

/**
 * Returns the equal-temperament frequency for a MIDI note number.
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Decomposes a frequency into note name, octave, cents deviation,
 * nearest MIDI note, and the exact equal-temperament target frequency.
 */
export function analyseFrequency(hz: number): Omit<TunerResult, "frequency"> {
  const midiExact = frequencyToMidiExact(hz);
  const midiRounded = Math.round(midiExact);
  const cents = Math.round((midiExact - midiRounded) * 100);
  const noteIndex = ((midiRounded % 12) + 12) % 12;
  const octave = Math.floor(midiRounded / 12) - 1;
  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    targetFrequency: midiToFrequency(midiRounded),
  };
}

/**
 * Computes the Normalised Square Difference Function (NSDF) used by MPM.
 * Returns an array of values in the range [−1, 1] where peaks indicate
 * likely period lengths.
 */
export function computeNsdf(buffer: Float32Array): Float32Array {
  const n = buffer.length;
  const nsdf = new Float32Array(n);

  // Pre-compute the "power" terms for the denominator
  // m[tau] = sum(x[j]^2, j=0..n-1) + sum(x[j]^2, j=tau..n-1)
  // We accumulate these incrementally.
  let m = 0;
  for (let j = 0; j < n; j++) {
    m += buffer[j] * buffer[j];
  }
  m *= 2;

  for (let tau = 0; tau < n; tau++) {
    // Numerator: autocorrelation
    let r = 0;
    for (let j = 0; j < n - tau; j++) {
      r += buffer[j] * buffer[j + tau];
    }
    // Denominator update: subtract the departing sample squared from each end
    if (tau > 0) {
      m -= buffer[tau - 1] * buffer[tau - 1] + buffer[n - tau] * buffer[n - tau];
    }
    nsdf[tau] = m === 0 ? 0 : (2 * r) / m;
  }

  return nsdf;
}

/**
 * Returns the estimated fundamental frequency from a time-domain buffer,
 * or null if no clear pitch is detected.
 *
 * @param buffer   Float32Array of time-domain PCM samples (−1 … 1)
 * @param sampleRate  Audio context sample rate (e.g. 44100)
 * @param minRms   Minimum RMS; bail out early if the signal is too quiet
 */
function findFirstNegativeCrossing(nsdf: Float32Array, minTau: number): number {
  for (let tau = 1; tau < nsdf.length - 1; tau++) {
    if (nsdf[tau - 1] >= 0 && nsdf[tau] < 0) {
      return tau;
    }
  }
  return minTau;
}

function findBestLocalMaximum(nsdf: Float32Array, startTau: number, maxTau: number): { bestTau: number, bestVal: number } {
  let bestTau = -1;
  let bestVal = -Infinity;
  for (let tau = startTau; tau < maxTau && tau < nsdf.length - 1; tau++) {
    if (nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) {
      if (nsdf[tau] > bestVal) {
        bestVal = nsdf[tau];
        bestTau = tau;
      }
      // Stop at first peak exceeding 0.8 (strong candidate)
      if (nsdf[tau] > 0.8) break;
    }
  }
  return { bestTau, bestVal };
}

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
  minRms = 0.01,
): number | null {
  // Gate on signal level
  let rms = 0;
  for (const sample of buffer) rms += sample * sample;
  rms = Math.sqrt(rms / buffer.length);
  if (rms < minRms) return null;

  const nsdf = computeNsdf(buffer);

  const maxTau = Math.floor(sampleRate / 50); // lowest note ~50 Hz
  const minTau = Math.floor(sampleRate / 1200); // highest note ~1200 Hz

  const firstNegativeCrossing = findFirstNegativeCrossing(nsdf, minTau);

  const { bestTau, bestVal } = findBestLocalMaximum(nsdf, firstNegativeCrossing, maxTau);

  if (bestTau < 0 || bestVal < 0.2) return null;

  // Parabolic interpolation for sub-sample precision
  const alpha = nsdf[bestTau - 1];
  const beta = nsdf[bestTau];
  const gamma = nsdf[bestTau + 1];
  const denom = alpha - 2 * beta + gamma;
  const refinedTau = denom === 0 ? bestTau : bestTau - (0.5 * (alpha - gamma)) / denom;

  return sampleRate / refinedTau;
}

/**
 * Starts real-time pitch detection from the default microphone.
 *
 * @returns A cleanup function that stops the tuner and releases the mic.
 */
export async function startTuner(
  onResult: (result: TunerResult | null) => void,
  options: TunerOptions = {},
): Promise<() => void> {
  const { intervalMs = 80, minRms = 0.01, fftSize = 2048 } = options;

  console.log("[tuner] creating AudioContext...");
  const audioCtx = new AudioContext();
  console.log("[tuner] AudioContext state:", audioCtx.state);

  let stream: MediaStream;
  try {
    console.log("[tuner] requesting getUserMedia...");
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    console.log("[tuner] stream acquired:", stream.id);
  } catch (err) {
    console.error("[tuner] getUserMedia failed:", err);
    audioCtx.close();
    throw err;
  }

  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = fftSize;
  source.connect(analyser);

  const buffer = new Float32Array(analyser.fftSize);
  let timerId: ReturnType<typeof setInterval> | null = null;

  console.log("[tuner] starting poll interval, sampleRate:", audioCtx.sampleRate);
  timerId = setInterval(() => {
    analyser.getFloatTimeDomainData(buffer);
    const hz = detectPitch(buffer, audioCtx.sampleRate, minRms);
    if (hz === null) {
      onResult(null);
      return;
    }
    const analysis = analyseFrequency(hz);
    onResult({ frequency: hz, ...analysis });
  }, intervalMs);

  return () => {
    if (timerId !== null) clearInterval(timerId);
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    audioCtx.close();
  };
}