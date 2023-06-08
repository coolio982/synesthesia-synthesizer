export function parseStringToJsonList(str: string) {
  // Remove the single quotes around keys and values
  const replacedStr = str.replace(/'/g, '"');
  // Parse the string into a JavaScript array
  const jsonArray = JSON.parse(replacedStr);
  return jsonArray;
}

export function calculateDisplacement(
  x: number,
  center: number,
  k: number,
  a: number
) {
  return k / (Math.abs(x - center) + a);
}
