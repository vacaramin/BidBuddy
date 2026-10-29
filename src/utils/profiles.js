import { getFromStorage, saveToStorage, STORAGE_KEYS } from "./localStorage";
import { PROVIDERS } from "./models";

export const emptyPersonalInfo = {
  name: "",
  email: "",
  phone: "",
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

export const emptyPromptSettings = {
  customPromptPrefix: "",
  customPromptSuffix: "",
  maxWords: 500,
  includeEmail: false,
  includePhone: false,
};

const LEGACY_ONBOARDING_KEY = "proposalGeneratorSettings";

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `profile-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const nowIso = () => new Date().toISOString();

export const normalizeApiKeys = (storedKeys = []) => {
  const list = Array.isArray(storedKeys) ? storedKeys : [];
  return PROVIDERS.map((provider) => {
    const found = list.find((key) => key.provider === provider.id);
    return {
      id: found?.id ?? provider.id,
      provider: provider.id,
      name: provider.name,
      apiKey: found?.apiKey || "",
      isValid: found?.isValid ?? null,
    };
  });
};

export const normalizePersonalInfo = (saved = {}) => ({
  ...emptyPersonalInfo,
  ...(saved || {}),
});

export const normalizePromptSettings = (saved = {}) => {
  const stored = saved || {};
  return {
    ...emptyPromptSettings,
    ...stored,
    includeEmail: stored.includeEmail === true,
    includePhone: stored.includePhone === true,
    maxWords:
      typeof stored.maxWords === "number" && stored.maxWords > 0
        ? stored.maxWords
        : 500,
  };
};

export const DEFAULT_PROFILE_NAME = "Personal";

const naturalProfileName = (name, fallbackName = DEFAULT_PROFILE_NAME) => {
  const trimmed = (name || "").trim();
  if (!trimmed || trimmed.toLowerCase() === "default") {
    return fallbackName;
  }
  return trimmed;
};

export const normalizeProfile = (
  saved,
  fallbackName = DEFAULT_PROFILE_NAME,
) => {
  const createdAt = saved?.createdAt || nowIso();
  const photo =
    typeof saved?.photo === "string" && saved.photo.startsWith("data:image/")
      ? saved.photo
      : "";
  return {
    id: saved?.id || newId(),
    name: naturalProfileName(saved?.name, fallbackName),
    headline: typeof saved?.headline === "string" ? saved.headline.trim() : "",
    photo,
    personalInfo: normalizePersonalInfo(saved?.personalInfo),
    promptSettings: normalizePromptSettings(saved?.promptSettings),
    createdAt,
    updatedAt: saved?.updatedAt || createdAt,
  };
};

export const profileOptionLabel = (profile) => {
  if (!profile) return "";
  const headline = profile.headline?.trim();
  return headline ? `${profile.name} — ${headline}` : profile.name;
};

/** Resize and compress an image file to a data URL for localStorage. */
export const readProfilePhoto = (file, { maxSize = 256, quality = 0.82 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Choose an image file"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Image must be under 8MB"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Couldn't load that image"));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Couldn't process that image"));
          return;
        }
        ctx.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const uniqueName = (desired, profiles, excludeId = null) => {
  const base = (desired || "Profile").trim() || "Profile";
  const taken = new Set(
    profiles
      .filter((profile) => profile.id !== excludeId)
      .map((profile) => profile.name.trim().toLowerCase()),
  );
  if (!taken.has(base.toLowerCase())) return base;
  let index = 2;
  while (taken.has(`${base} ${index}`.toLowerCase())) index += 1;
  return `${base} ${index}`;
};

const isLegacySingleSettings = (saved) =>
  saved &&
  typeof saved === "object" &&
  !Array.isArray(saved.profiles) &&
  (saved.personalInfo || saved.promptSettings || saved.apiKeys);

const fromLegacyOnboarding = () => {
  try {
    const raw = localStorage.getItem(LEGACY_ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      personalInfo: parsed.personalInfo,
      promptSettings: parsed.promptSettings,
      apiKeys: parsed.apiKeys,
    };
  } catch {
    return null;
  }
};

export const migrateToStore = (saved) => {
  if (saved && Array.isArray(saved.profiles) && saved.profiles.length > 0) {
    const profiles = [];
    saved.profiles.forEach((profile, index) => {
      const normalized = normalizeProfile(
        profile,
        index === 0 ? DEFAULT_PROFILE_NAME : `Profile ${index + 1}`,
      );
      profiles.push({
        ...normalized,
        name: uniqueName(normalized.name, profiles),
      });
    });
    const activeExists = profiles.some(
      (profile) => profile.id === saved.activeProfileId,
    );
    return {
      activeProfileId: activeExists ? saved.activeProfileId : profiles[0].id,
      apiKeys: normalizeApiKeys(saved.apiKeys),
      profiles,
    };
  }

  if (isLegacySingleSettings(saved)) {
    const profile = normalizeProfile(
      {
        name: DEFAULT_PROFILE_NAME,
        personalInfo: saved.personalInfo,
        promptSettings: saved.promptSettings,
      },
      DEFAULT_PROFILE_NAME,
    );
    return {
      activeProfileId: profile.id,
      apiKeys: normalizeApiKeys(saved.apiKeys),
      profiles: [profile],
    };
  }

  const onboarding = fromLegacyOnboarding();
  if (onboarding) {
    const profile = normalizeProfile(
      {
        name: DEFAULT_PROFILE_NAME,
        personalInfo: onboarding.personalInfo,
        promptSettings: onboarding.promptSettings,
      },
      DEFAULT_PROFILE_NAME,
    );
    return {
      activeProfileId: profile.id,
      apiKeys: normalizeApiKeys(onboarding.apiKeys),
      profiles: [profile],
    };
  }

  const profile = normalizeProfile(
    { name: DEFAULT_PROFILE_NAME },
    DEFAULT_PROFILE_NAME,
  );
  return {
    activeProfileId: profile.id,
    apiKeys: normalizeApiKeys([]),
    profiles: [profile],
  };
};

export const normalizeStore = (saved) => migrateToStore(saved);

export const loadStore = () => {
  const raw = getFromStorage(STORAGE_KEYS.SETTINGS, null);
  const store = normalizeStore(raw);
  const needsWrite =
    !raw ||
    !Array.isArray(raw.profiles) ||
    JSON.stringify(raw) !== JSON.stringify(store);
  if (needsWrite) saveToStorage(STORAGE_KEYS.SETTINGS, store);
  return store;
};

export const saveStore = (store) => {
  const normalized = normalizeStore(store);
  saveToStorage(STORAGE_KEYS.SETTINGS, normalized);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bidbuddy:profiles-changed"));
  }
  return normalized;
};

export const listProfiles = (store) =>
  [...(store?.profiles || [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

export const getProfileById = (store, id) =>
  store?.profiles?.find((profile) => profile.id === id) || null;

export const getActiveProfile = (store) => {
  const active = getProfileById(store, store?.activeProfileId);
  if (active) return active;
  return store?.profiles?.[0] || null;
};

export const setActiveProfileId = (store, id) => {
  if (!getProfileById(store, id)) return store;
  return saveStore({ ...store, activeProfileId: id });
};

export const isProfileNameTaken = (store, name, excludeId = null) => {
  const needle = name.trim().toLowerCase();
  if (!needle) return true;
  return (store?.profiles || []).some(
    (profile) =>
      profile.id !== excludeId &&
      profile.name.trim().toLowerCase() === needle,
  );
};

export const createProfile = (store, { name, cloneFromId } = {}) => {
  const source = cloneFromId ? getProfileById(store, cloneFromId) : null;
  const label = uniqueName(name || (source ? `${source.name} copy` : "Profile"), store.profiles);
  const profile = normalizeProfile(
    {
      id: newId(),
      name: label,
      headline: source?.headline || "",
      photo: source?.photo || "",
      personalInfo: source ? source.personalInfo : emptyPersonalInfo,
      promptSettings: source ? source.promptSettings : emptyPromptSettings,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    label,
  );
  const next = {
    ...store,
    activeProfileId: profile.id,
    profiles: [...store.profiles, profile],
  };
  return { store: saveStore(next), profile };
};

export const updateProfile = (store, id, patch = {}) => {
  const profiles = store.profiles.map((profile) => {
    if (profile.id !== id) return profile;
    return normalizeProfile(
      {
        ...profile,
        ...patch,
        id: profile.id,
        personalInfo: patch.personalInfo
          ? { ...profile.personalInfo, ...patch.personalInfo }
          : profile.personalInfo,
        promptSettings: patch.promptSettings
          ? { ...profile.promptSettings, ...patch.promptSettings }
          : profile.promptSettings,
        updatedAt: nowIso(),
      },
      profile.name,
    );
  });
  return saveStore({ ...store, profiles });
};

export const renameProfile = (store, id, name) => {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return { store, error: "Profile name is required" };
  }
  if (isProfileNameTaken(store, trimmed, id)) {
    return { store, error: "That profile name is already used" };
  }
  return {
    store: updateProfile(store, id, { name: trimmed }),
    error: null,
  };
};

export const deleteProfile = (store, id) => {
  if ((store.profiles || []).length <= 1) {
    return { store, error: "You need at least one profile" };
  }
  if (!getProfileById(store, id)) {
    return { store, error: "Profile not found" };
  }

  const remaining = store.profiles.filter((profile) => profile.id !== id);
  const sorted = [...remaining].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const nextActive =
    store.activeProfileId === id ? sorted[0].id : store.activeProfileId;

  return {
    store: saveStore({
      ...store,
      activeProfileId: nextActive,
      profiles: remaining,
    }),
    error: null,
  };
};

export const updateApiKeys = (store, apiKeys) =>
  saveStore({ ...store, apiKeys: normalizeApiKeys(apiKeys) });

export const resolveProfileLabel = (store, profileId, snapshotName = "") => {
  const live = getProfileById(store, profileId);
  if (live) return live.name;
  if (snapshotName) return snapshotName;
  return "Deleted profile";
};

export const validatePersonalInfo = (info) => {
  const nextErrors = {};
  const personal = normalizePersonalInfo(info);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (!personal.name.trim()) nextErrors.name = "Name is required";
  if (!personal.email.trim()) nextErrors.email = "Email is required";
  else if (!isValidEmail(personal.email)) nextErrors.email = "Enter a valid email";
  if (!isValidUrl(personal.githubUrl)) nextErrors.githubUrl = "Enter a valid URL";
  if (!isValidUrl(personal.linkedinUrl)) {
    nextErrors.linkedinUrl = "Enter a valid URL";
  }
  if (!isValidUrl(personal.portfolioUrl)) {
    nextErrors.portfolioUrl = "Enter a valid URL";
  }
  return nextErrors;
};
