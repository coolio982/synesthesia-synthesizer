export const midiA = 69;

export const notes = [
  'A',
  'A#',
  'B',
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
];

export function pitchNoteOctave(pitch) {
  return {
    note: pitch > 0 ? pitch % 12 : 12 + (pitch % 12),
    octave: Math.floor(pitch / 12) + 4,
  };
}

export function pitchFreq(
  pitch = 0,
  octave = 3,
  middleA = 440,
  tuning = 'equal'
) {
  let hz = 0;
  const justCents = [
    0, 112, 204, 316, 386, 498, 590, 702, 814, 884, 1017, 1088,
  ];
  if (tuning === 'equal') {
    hz = middleA * 2 ** (octave - 3 + pitch / 12);
  }
  if (tuning === 'just') {
    const diff = 2 ** (justCents[pitch] / 1200);
    hz = middleA * 2 ** (octave - 4) * diff;
  }
  return hz;
}

export function pitchColor(pitch = 0, octaveParam, velocity = 1, alpha = 1) {
  const octave = octaveParam || Math.floor(pitch / 12) + 4;
  return `hsla(${(pitch % 12) * 30},${velocity * 100}%,${
    Math.abs(octave + 2) * 8
  }%,${alpha})`;
}

export function freqPitch(freq, middleA = 440) {
  return 12 * (Math.log(freq / middleA) / Math.log(2));
}

export function freqColor(freq) {
  return pitchColor(freqPitch(freq));
}

export function rotateArray(arr, count = 1) {
  return [...arr.slice(count, arr.length), ...arr.slice(0, count)];
}

export function clampNum(main, delta, min = 0, max = 100) {
  return Math.max(min, Math.min(Number(main) + Number(delta), max));
}
