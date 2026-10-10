// lib/uuid.ts — pure-JS UUID v4.
//
// Why not a library: `crypto.randomUUID`/`getRandomValues` do not exist in Hermes
// (same class of gap as the missing `atob` that broke login), and `expo-crypto` is a
// native module — adding one would cost an EAS rebuild and break OTA shipping.
// This is only used to mint client-side row ids, never for anything security-bearing.

const HEX: string[] = [];
for (let i = 0; i < 256; i++) HEX.push((i + 0x100).toString(16).slice(1));

/** RFC-4122 v4 UUID (Math.random-backed — client row ids only, NOT crypto-grade). */
export function uuidv4(): string {
  const b = new Array<number>(16);
  for (let i = 0; i < 16; i++) b[i] = (Math.random() * 256) | 0;
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10
  return (
    HEX[b[0]] + HEX[b[1]] + HEX[b[2]] + HEX[b[3]] + '-' +
    HEX[b[4]] + HEX[b[5]] + '-' +
    HEX[b[6]] + HEX[b[7]] + '-' +
    HEX[b[8]] + HEX[b[9]] + '-' +
    HEX[b[10]] + HEX[b[11]] + HEX[b[12]] + HEX[b[13]] + HEX[b[14]] + HEX[b[15]]
  );
}
