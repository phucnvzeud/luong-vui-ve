import { DEFAULT_CONFIG, type PayrollConfig } from "./payroll";

export const PROFILES_KEY = "payrollvn:configProfiles:v1";
export const LAST_PROFILE_KEY = "payrollvn:lastProfile:v1";

export interface ConfigProfile {
  id: string;
  name: string;
  config: PayrollConfig;
  updatedAt: number;
}

export function loadProfiles(): ConfigProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Hợp nhất với DEFAULT_CONFIG để bù field thiếu khi schema mở rộng
    return parsed.map((p: ConfigProfile) => ({
      ...p,
      config: mergeConfig(p.config),
    }));
  } catch {
    return [];
  }
}

export function saveProfiles(list: ConfigProfile[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getLastProfileId(): string | null {
  try {
    return localStorage.getItem(LAST_PROFILE_KEY);
  } catch {
    return null;
  }
}

export function setLastProfileId(id: string | null) {
  try {
    if (id) localStorage.setItem(LAST_PROFILE_KEY, id);
    else localStorage.removeItem(LAST_PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function mergeConfig(partial: Partial<PayrollConfig> | undefined): PayrollConfig {
  if (!partial) return { ...DEFAULT_CONFIG };
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    regionMinWages: { ...DEFAULT_CONFIG.regionMinWages, ...(partial.regionMinWages ?? {}) },
    levelAllowances: { ...DEFAULT_CONFIG.levelAllowances, ...(partial.levelAllowances ?? {}) },
    taxableFlags: { ...DEFAULT_CONFIG.taxableFlags, ...(partial.taxableFlags ?? {}) },
    taxBrackets: partial.taxBrackets ?? DEFAULT_CONFIG.taxBrackets,
  };
}

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
