export const STORAGE_KEYS = {
  SETTINGS: "bidbuddy_settings",
  PROPOSALS: "bidbuddy_proposals",
  ANALYTICS: "bidbuddy_analytics",
  PROFILES: "bidbuddy_profiles",
  CURRENT_PROFILE_ID: "bidbuddy_current_profile_id",
};

export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue;
  }
};

export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};
