// src/config/apiConfig.ts

export const API_KEYS = {
  ONSHORE_API_KEY: import.meta.env.VITE_ONSHORE_API_KEY || "",
  OFFSHORE_API_KEY: import.meta.env.VITE_OFFSHORE_API_KEY || "",
  MASTER_API_KEY: import.meta.env.VITE_MASTER_API_KEY || "",
};

export const BACKUP_API_KEYS = [
  "AIzaSyBvHpRvjIn8L-KBmPO6sTFvMphFk1T8k-E",
  "AIzaSyB9xEFz8SvcMGiFrOAmtbwNm_oGYl-VPmg",
  "AIzaSyDTvPaA1q7E8X1UI78Yw_Il8aZ-iN2j_B8"
];

let currentKeyIndex = -1; // -1 means use MASTER_API_KEY

export function resetApiKeys(): void {
  currentKeyIndex++;
  if (currentKeyIndex >= BACKUP_API_KEYS.length) {
    currentKeyIndex = -1; // Loop back to master
  }
}

export function getEffectiveApiKey(cycleError: boolean = false): string {
  if (cycleError) {
    currentKeyIndex++;
    if (currentKeyIndex >= BACKUP_API_KEYS.length) {
      currentKeyIndex = -1; // Loop back to master
    }
  }
  return currentKeyIndex === -1 ? API_KEYS.MASTER_API_KEY : BACKUP_API_KEYS[currentKeyIndex];
}