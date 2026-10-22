export function isHan(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return (
    (cp >= 0x2e80 && cp <= 0x2fdf) ||
    (cp >= 0x31c0 && cp <= 0x31ef) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xe000 && cp <= 0xf8ff) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0x20000 && cp <= 0x323af) ||
    (cp >= 0xf0000 && cp <= 0xffffd)
  );
}
