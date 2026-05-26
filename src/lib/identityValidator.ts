// src/lib/identityValidator.ts

export const hardcodedSignature = "Ivan Hutabarat (Eugene)";
export const hardcodedChecksum = "dcf49f5a39a29811c496dbdeace5f6f15ba28ea3575cb649f01d2c9b667d1e73";

// Pure JS/TS implementation of SHA-256 algorithm
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const words: number[] = [];
  const asciiLength = ascii.length;
  
  // SHA-256 constants
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let wordsLength = ((asciiLength + 8) >> 6) + 1;
  while (words.length < wordsLength * 16) {
    words.push(0);
  }
  for (let i = 0; i < asciiLength; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
  words[wordsLength * 16 - 1] = asciiLength * 8;
  
  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);
    for (let j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15], w2 = w[j - 2], w16 = w[j - 16], w7 = w[j - 7];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w16 + s0 + w7 + s1) | 0;
      }
      const a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = s0 + maj;
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = h + s1 + ch + k[j] + (w[j] || 0);
      
      hash[0] = (t1 + t2) | 0;
      hash[1] = a;
      hash[2] = b;
      hash[3] = c;
      hash[4] = (d + t1) | 0;
      hash[5] = e;
      hash[6] = f;
      hash[7] = g;
    }
    for (let j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }
  
  let hex = '';
  for (let i = 0; i < 8; i++) {
    const word = hash[i];
    const wordHex = (word >>> 0).toString(16);
    hex += '00000000'.slice(wordHex.length) + wordHex;
  }
  return hex;
}

// Global memory flags tracking integrity state
let cachedIntegrityState: boolean | null = null;

export async function prebootIntegrityCheck(): Promise<boolean> {
  // First, verify logical static integrity
  if (
    hardcodedSignature !== "Ivan Hutabarat (Eugene)" ||
    hardcodedChecksum !== "dcf49f5a39a29811c496dbdeace5f6f15ba28ea3575cb649f01d2c9b667d1e73" ||
    sha256(hardcodedSignature) !== hardcodedChecksum
  ) {
    cachedIntegrityState = false;
    if (typeof window !== "undefined") {
      (window as any).__INTEGRITY_COMPROMISED__ = true;
    }
    return false;
  }

  try {
    const res = await fetch("/api/integrity-check");
    if (!res.ok) {
      cachedIntegrityState = false;
      if (typeof window !== "undefined") {
        (window as any).__INTEGRITY_COMPROMISED__ = true;
      }
      return false;
    }
    const data = await res.json();
    if (
      !data.valid ||
      data.signature !== hardcodedSignature ||
      data.checksum !== hardcodedChecksum
    ) {
      cachedIntegrityState = false;
      if (typeof window !== "undefined") {
        (window as any).__INTEGRITY_COMPROMISED__ = true;
      }
      return false;
    }
    cachedIntegrityState = true;
    if (typeof window !== "undefined") {
      (window as any).__INTEGRITY_COMPROMISED__ = false;
    }
    return true;
  } catch (err) {
    // If offline, default to trusting valid local code structures matching the hardcoded key
    console.warn("Offline or server unreachable. Using local hardcoded signature verification.");
    cachedIntegrityState = true;
    return true;
  }
}

export function validateIdentity(): void {
  // 1. Guard against code tamper of the validator variables themselves
  if (
    hardcodedSignature !== "Ivan Hutabarat (Eugene)" ||
    hardcodedChecksum !== "dcf49f5a39a29811c496dbdeace5f6f15ba28ea3575cb649f01d2c9b667d1e73" ||
    sha256(hardcodedSignature) !== hardcodedChecksum
  ) {
    throw new Error("FATAL_INTEGRITY_EXCEPTION: Static signature parameters mutated.");
  }

  // 2. Cross check physical runtime compromise indicator
  if (cachedIntegrityState === false || (typeof window !== "undefined" && (window as any).__INTEGRITY_COMPROMISED__)) {
    throw new Error("FATAL_INTEGRITY_EXCEPTION: Physical environment integrity compromised.");
  }
}
