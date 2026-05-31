// src/config/apiConfig.ts
import { decryptKey } from "../lib/cryptoShield";

export const KEY_RING = [
  import.meta.env.VITE_GEMINI_KEY_0 || "",
  import.meta.env.VITE_GEMINI_KEY_1 || "",
  import.meta.env.VITE_GEMINI_KEY_2 || "",
  import.meta.env.VITE_GEMINI_KEY_3 || ""
].filter(Boolean);

let currentRingIndex = 0;

export function getEffectiveApiKey(cycleNext: boolean = false): string {
    if (cycleNext && KEY_RING.length > 0) {
        currentRingIndex = (currentRingIndex + 1) % KEY_RING.length;
    }
    
    try {
        const encoded = localStorage.getItem("_vanbotz_encrypted_gemini_key");
        if (encoded) {
            const decoded = decryptKey(encoded);
            if (decoded && decoded.trim().length > 0) {
                return decoded;
            }
        }
    } catch (e) {}

    return KEY_RING[currentRingIndex] || "";
}

export function getAvailableKeysCount(): number {
  return KEY_RING.length;
}

export function resetApiKeys(): void {
  // Legacy stub to prevent build breaks.
  currentRingIndex = (currentRingIndex + 1) % KEY_RING.length;
}
