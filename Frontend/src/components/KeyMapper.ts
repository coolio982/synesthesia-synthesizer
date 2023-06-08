export default function keyMapper(key: string, base: number) {
  switch (key) {
    // Lowercase
    case 'a':
      return base;
    case 'w':
      return base + 1;
    case 's':
      return base + 2;
    case 'e':
      return base + 3;
    case 'd':
      return base + 4;
    case 'f':
      return base + 5;
    case 't':
      return base + 6;
    case 'g':
      return base + 7;
    case 'y':
      return base + 8;
    case 'h':
      return base + 9;
    case 'u':
      return base + 10;
    case 'j':
      return base + 11;
    case 'k':
      return base + 12;
    case 'o':
      return base + 13;
    case 'l':
      return base + 14;
    case 'p':
      return base + 15;
    // Uppercase
    case 'A':
      return base;
    case 'W':
      return base + 1;
    case 'S':
      return base + 2;
    case 'E':
      return base + 3;
    case 'D':
      return base + 4;
    case 'F':
      return base + 5;
    case 'T':
      return base + 6;
    case 'G':
      return base + 7;
    case 'Y':
      return base + 8;
    case 'H':
      return base + 9;
    case 'U':
      return base + 10;
    case 'J':
      return base + 11;
    case 'K':
      return base + 12;
    case 'O':
      return base + 13;
    case 'L':
      return base + 14;
    case 'P':
      return base + 15;
    default:
      return -1;
  }
}
