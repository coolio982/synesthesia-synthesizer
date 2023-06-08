export const oscillatorTypes = [
  'sine',
  'square',
  'sawtooth',
  'triangle',
  'pulse',
];
export const notes = [
  'C',
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
  'G#',
  'D#',
  'A#',
  'F',
];
export const colours = [
  // scriabin circle of fifths colours
  '#ff0000',
  '#ff7f00',
  '#ffff00',
  '#33cc33',
  '#c3f2ff',
  '#8ec9ff',
  '#7f8bfd',
  '#9000ff',
  '#bb75fc',
  '#b7468b',
  '#a9677c',
  '#ab0034',
];

export const keyboard = [
  'a',
  'w',
  's',
  'e',
  'd',
  'r',
  'f',
  't',
  'g',
  'y',
  'h',
  'u',
  'j',
  'i',
  'k',
  'o',
  'l',
];

export function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function lightenHexColor(hexColor, amount = 0.2) {
  // Convert hex color to RGB
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);

  // Add some value to each RGB component
  const newR = Math.min(255, r + 255 * amount);
  const newG = Math.min(255, g + 255 * amount);
  const newB = Math.min(255, b + 255 * amount);

  // Convert RGB back to hex color
  const newHexColor = `#${Math.floor(newR)
    .toString(16)
    .padStart(2, '0')}${Math.floor(newG)
    .toString(16)
    .padStart(2, '0')}${Math.floor(newB).toString(16).padStart(2, '0')}`;

  return newHexColor;
}
