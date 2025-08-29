import { useState, useEffect } from "preact/hooks";
import styled from "styled-components";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";

const Settings = ({ className }) => {
  // Default settings structure
  const defaultSettings = {
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      githubUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
    },
    apiKeys: [
      { id: 1, provider: "openai", name: "OpenAI", apiKey: "", isValid: null },
      {
        id: 2,
        provider: "anthropic",
        name: "Anthropic (Claude)",
        apiKey: "",
        isValid: null,
      },
    ],
    promptSettings: {
      customPromptPrefix: "",
      customPromptSuffix: "",
      maxWords: 500,
    },
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileId] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profiles");
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  // Load settings on component mount
  useEffect(() => {
    const savedSettings = getFromStorage(
      STORAGE_KEYS.SETTINGS,
      defaultSettings,
    );
    const savedProfiles = getFromStorage(STORAGE_KEYS.PROFILES, []);
    const savedCurrentProfileId = getFromStorage(STORAGE_KEYS.CURRENT_PROFILE_ID, null);
    
    setSettings(savedSettings);
    setProfiles(savedProfiles);
    setCurrentProfileId(savedCurrentProfileId);

    // If no profiles exist, create a default one
    if (savedProfiles.length === 0) {
      const defaultProfile = {
        ...defaultSettings,
        id: "default",
        name: "Default Profile",
        description: "Your main bidding profile",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfiles([defaultProfile]);
      setCurrentProfileId("default");
      saveToStorage(STORAGE_KEYS.PROFILES, [defaultProfile]);
      saveToStorage(STORAGE_KEYS.CURRENT_PROFILE_ID, "default");
    }
  }, []);

  // Update settings when profile changes
  useEffect(() => {
    if (currentProfileId && profiles.length > 0) {
      const currentProfile = profiles.find(p => p.id === currentProfileId);
      if (currentProfile) {
        setSettings({
          personalInfo: { ...currentProfile.personalInfo },
          apiKeys: [...currentProfile.apiKeys],
          promptSettings: { ...currentProfile.promptSettings },
        });
      }
    }
  }, [currentProfileId, profiles]);

  // Handle input changes for personal info
  const handlePersonalInfoChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));

    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle API key changes
  const handleApiKeyChange = (id, value) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.map((key) =>
        key.id === id ? { ...key, apiKey: value, isValid: null } : key,
      ),
    }));
  };

  // Handle prompt settings changes
  const handlePromptSettingChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      promptSettings: {
        ...prev.promptSettings,
        [field]: value,
      },
    }));
  };

  // Profile management functions
  const saveCurrentProfile = () => {
    if (currentProfileId && profiles.length > 0) {
      const updatedProfiles = profiles.map(profile => {
        if (profile.id === currentProfileId) {
          return {
            ...profile,
            personalInfo: { ...settings.personalInfo },
            apiKeys: [...settings.apiKeys],
            promptSettings: { ...settings.promptSettings },
            updatedAt: new Date().toISOString(),
          };
        }
        return profile;
      });
      setProfiles(updatedProfiles);
      saveToStorage(STORAGE_KEYS.PROFILES, updatedProfiles);
    }
  };

  const createProfile = (profileData) => {
    const newProfile = {
      ...defaultSettings,
      id: `profile_${Date.now()}`,
      name: profileData.name,
      description: profileData.description,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    saveToStorage(STORAGE_KEYS.PROFILES, updatedProfiles);
    
    setShowProfileForm(false);
    setEditingProfile(null);
    setSuccessMessage("Profile created successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const updateProfile = (profileId, profileData) => {
    const updatedProfiles = profiles.map(profile => {
      if (profile.id === profileId) {
        return {
          ...profile,
          name: profileData.name,
          description: profileData.description,
          updatedAt: new Date().toISOString(),
        };
      }
      return profile;
    });
    
    setProfiles(updatedProfiles);
    saveToStorage(STORAGE_KEYS.PROFILES, updatedProfiles);
    
    setShowProfileForm(false);
    setEditingProfile(null);
    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const switchProfile = (profileId) => {
    saveCurrentProfile();
    
    setCurrentProfileId(profileId);
    saveToStorage(STORAGE_KEYS.CURRENT_PROFILE_ID, profileId);
    
    const updatedProfiles = profiles.map(profile => ({
      ...profile,
      isActive: profile.id === profileId,
    }));
    setProfiles(updatedProfiles);
    saveToStorage(STORAGE_KEYS.PROFILES, updatedProfiles);
    
    setSuccessMessage("Profile switched successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const deleteProfile = (profileId) => {
    if (profiles.length <= 1) {
      alert("You must have at least one profile.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
      const updatedProfiles = profiles.filter(profile => profile.id !== profileId);
      setProfiles(updatedProfiles);
      saveToStorage(STORAGE_KEYS.PROFILES, updatedProfiles);
      
      if (currentProfileId === profileId) {
        const newCurrentProfileId = updatedProfiles[0].id;
        setCurrentProfileId(newCurrentProfileId);
        saveToStorage(STORAGE_KEYS.CURRENT_PROFILE_ID, newCurrentProfileId);
      }
      
      setSuccessMessage("Profile deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate URL format
  const isValidUrl = (url) => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Test API key (mock function - you can replace with actual API calls)
  const testApiKey = async (provider, apiKey) => {
    if (!apiKey.trim()) return false;

    return new Promise((resolve) => {
      setTimeout(() => {
        let isValid = false;
        switch (provider) {
          case "openai":
            isValid = apiKey.startsWith("sk-") && apiKey.length > 20;
            break;
          case "anthropic":
            isValid = apiKey.startsWith("sk-ant-") && apiKey.length > 30;
            break;
          default:
            isValid = apiKey.length > 10;
        }
        resolve(isValid);
      }, 1000);
    });
  };

  // Handle API key testing
  const handleTestApiKey = async (id, provider, apiKey) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.map((key) =>
        key.id === id ? { ...key, isValid: "testing" } : key,
      ),
    }));

    const isValid = await testApiKey(provider, apiKey);

    setSettings((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.map((key) =>
        key.id === id ? { ...key, isValid } : key,
      ),
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!settings.personalInfo.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!settings.personalInfo.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(settings.personalInfo.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (
      settings.personalInfo.githubUrl &&
      !isValidUrl(settings.personalInfo.githubUrl)
    ) {
      newErrors.githubUrl = "Please enter a valid GitHub URL";
    }

    if (
      settings.personalInfo.linkedinUrl &&
      !isValidUrl(settings.personalInfo.linkedinUrl)
    ) {
      newErrors.linkedinUrl = "Please enter a valid LinkedIn URL";
    }

    if (
      settings.personalInfo.portfolioUrl &&
      !isValidUrl(settings.personalInfo.portfolioUrl)
    ) {
      newErrors.portfolioUrl = "Please enter a valid portfolio URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      saveCurrentProfile();
      setSuccessMessage("Settings saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all settings to default? This action cannot be undone.",
      )
    ) {
      setSettings(defaultSettings);
      setErrors({});
      setSuccessMessage("Settings reset to defaults");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Profile Form Component
  const ProfileForm = ({ profile, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: profile?.name || "",
      description: profile?.description || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name.trim()) {
        alert("Profile name is required");
        return;
      }
      onSubmit(formData);
    };

    return (
      <div className="profile-form-overlay">
        <div className="profile-form">
          <h3>{profile ? "Edit Profile" : "Create New Profile"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="profileName">Profile Name *</label>
              <input
                id="profileName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Freelancer Profile, Agency Profile"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="profileDescription">Description</label>
              <textarea
                id="profileDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this profile's purpose or specialization"
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                {profile ? "Update Profile" : "Create Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <h1>Settings</h1>
      <div className="container">
        <div className="content-area">
          {successMessage && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {successMessage}
            </div>
          )}

          <div className="tabs">
            <button
              className={`tab ${activeTab === "profiles" ? "active" : ""}`}
              onClick={() => setActiveTab("profiles")}
            >
              <span className="tab-icon">👥</span>
              Profiles
            </button>
            <button
              className={`tab ${activeTab === "personal" ? "active" : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              <span className="tab-icon">👤</span>
              Personal Info
            </button>
            <button
              className={`tab ${activeTab === "api" ? "active" : ""}`}
              onClick={() => setActiveTab("api")}
            >
              <span className="tab-icon">🔑</span>
              API Keys
            </button>
            <button
              className={`tab ${activeTab === "prompts" ? "active" : ""}`}
              onClick={() => setActiveTab("prompts")}
            >
              <span className="tab-icon">💬</span>
              Prompt Settings
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "profiles" && (
              <div className="section">
                <div className="profiles-header">
                  <h2>Bidding Profiles</h2>
                  <p>Manage different profiles for different types of bidding projects</p>
                  <button
                    className="create-profile-btn"
                    onClick={() => setShowProfileForm(true)}
                  >
                    + Create New Profile
                  </button>
                </div>

                <div className="profiles-grid">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`profile-card ${profile.isActive ? "active" : ""}`}
                    >
                      <div className="profile-header">
                        <h3>{profile.name}</h3>
                        {profile.isActive && (
                          <span className="active-badge">Active</span>
                        )}
                      </div>
                      <p className="profile-description">{profile.description}</p>
                      <div className="profile-meta">
                        <span>Created: {new Date(profile.createdAt).toLocaleDateString()}</span>
                        <span>Updated: {new Date(profile.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="profile-actions">
                        {!profile.isActive && (
                          <button
                            className="switch-btn"
                            onClick={() => switchProfile(profile.id)}
                          >
                            Switch to This Profile
                          </button>
                        )}
                        <button
                          className="edit-btn"
                          onClick={() => {
                            setEditingProfile(profile);
                            setShowProfileForm(true);
                          }}
                        >
                          Edit
                        </button>
                        {profiles.length > 1 && (
                          <button
                            className="delete-btn"
                            onClick={() => deleteProfile(profile.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {profiles.length === 0 && (
                  <div className="no-profiles">
                    <p>No profiles created yet. Create your first profile to get started!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "personal" && (
              <div className="section">
                <div className="section-header">
                  <h2>Personal Information</h2>
                  <p>Configure your personal details for the current profile: <strong>{profiles.find(p => p.id === currentProfileId)?.name || "Default Profile"}</strong></p>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <div className="input-wrapper">
                      <input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={settings.personalInfo.name}
                        onChange={(e) =>
                          handlePersonalInfoChange("name", e.target.value)
                        }
                        className={errors.name ? "error" : ""}
                      />
                    </div>
                    {errors.name && (
                      <span className="error-message">{errors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <div className="input-wrapper">
                      <input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={settings.personalInfo.email}
                        onChange={(e) =>
                          handlePersonalInfoChange("email", e.target.value)
                        }
                        className={errors.email ? "error" : ""}
                      />
                    </div>
                    {errors.email && (
                      <span className="error-message">{errors.email}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <div className="input-wrapper">
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={settings.personalInfo.phone}
                        onChange={(e) =>
                          handlePersonalInfoChange("phone", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="portfolioUrl">Portfolio URL</label>
                    <div className="input-wrapper">
                      <input
                        id="portfolioUrl"
                        type="url"
                        placeholder="https://yourportfolio.com"
                        value={settings.personalInfo.portfolioUrl}
                        onChange={(e) =>
                          handlePersonalInfoChange(
                            "portfolioUrl",
                            e.target.value,
                          )
                        }
                        className={errors.portfolioUrl ? "error" : ""}
                      />
                    </div>
                    {errors.portfolioUrl && (
                      <span className="error-message">
                        {errors.portfolioUrl}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="githubUrl">GitHub URL</label>
                    <div className="input-wrapper">
                      <input
                        id="githubUrl"
                        type="url"
                        placeholder="https://github.com/yourusername"
                        value={settings.personalInfo.githubUrl}
                        onChange={(e) =>
                          handlePersonalInfoChange("githubUrl", e.target.value)
                        }
                        className={errors.githubUrl ? "error" : ""}
                      />
                    </div>
                    {errors.githubUrl && (
                      <span className="error-message">{errors.githubUrl}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="linkedinUrl">LinkedIn URL</label>
                    <div className="input-wrapper">
                      <input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/yourusername"
                        value={settings.personalInfo.linkedinUrl}
                        onChange={(e) =>
                          handlePersonalInfoChange(
                            "linkedinUrl",
                            e.target.value,
                          )
                        }
                        className={errors.linkedinUrl ? "error" : ""}
                      />
                    </div>
                    {errors.linkedinUrl && (
                      <span className="error-message">
                        {errors.linkedinUrl}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="section">
                <div className="section-header">
                  <h2>API Keys</h2>
                  <p>Configure API keys for the current profile: <strong>{profiles.find(p => p.id === currentProfileId)?.name || "Default Profile"}</strong></p>
                </div>
                {settings.apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="api-key-group">
                    <div className="api-key-header">
                      <h3>{apiKey.name}</h3>
                      {apiKey.isValid === true && (
                        <span className="status-badge success">✅ Valid</span>
                      )}
                      {apiKey.isValid === false && (
                        <span className="status-badge error">❌ Invalid</span>
                      )}
                      {apiKey.isValid === "testing" && (
                        <span className="status-badge testing">
                          🔄 Testing...
                        </span>
                      )}
                    </div>

                    <div className="api-key-input-group">
                      <div className="input-wrapper">
                        <input
                          type="password"
                          placeholder={`Enter your ${apiKey.name} API key`}
                          value={apiKey.apiKey}
                          onChange={(e) =>
                            handleApiKeyChange(apiKey.id, e.target.value)
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="test-btn"
                        onClick={() =>
                          handleTestApiKey(
                            apiKey.id,
                            apiKey.provider,
                            apiKey.apiKey,
                          )
                        }
                        disabled={
                          !apiKey.apiKey.trim() || apiKey.isValid === "testing"
                        }
                      >
                        {apiKey.isValid === "testing" ? "Testing..." : "Test"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "prompts" && (
              <div className="section">
                <div className="section-header">
                  <h2>Prompt Settings</h2>
                  <p>Configure prompt settings for the current profile: <strong>{profiles.find(p => p.id === currentProfileId)?.name || "Default Profile"}</strong></p>
                </div>
                <div className="form-group">
                  <label htmlFor="customPromptPrefix">
                    Custom Prompt Prefix
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="customPromptPrefix"
                      rows={3}
                      placeholder="e.g., 'As an experienced developer with 5+ years in web development...'"
                      value={settings.promptSettings.customPromptPrefix}
                      onChange={(e) =>
                        handlePromptSettingChange(
                          "customPromptPrefix",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="customPromptSuffix">
                    Custom Prompt Suffix
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="customPromptSuffix"
                      rows={3}
                      placeholder="e.g., 'I'm available to start immediately and would love to discuss this project further.'"
                      value={settings.promptSettings.customPromptSuffix}
                      onChange={(e) =>
                        handlePromptSettingChange(
                          "customPromptSuffix",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="maxWords">
                      Maximum Words
                      <span className="label-hint">
                        Target length for proposals
                      </span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="maxWords"
                        type="number"
                        min="100"
                        max="2000"
                        placeholder="500"
                        value={settings.promptSettings.maxWords}
                        onChange={(e) =>
                          handlePromptSettingChange(
                            "maxWords",
                            parseInt(e.target.value) || 500,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Actions Bar */}
        <div className="sticky-actions">
          <div className="actions">
            <button
              type="button"
              className="reset-btn"
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </button>
            <button type="button" className="save-btn" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {showProfileForm && (
        <ProfileForm
          profile={editingProfile}
          onSubmit={editingProfile ? updateProfile : createProfile}
          onCancel={() => {
            setShowProfileForm(false);
            setEditingProfile(null);
          }}
        />
      )}
    </div>
  );
};

export default styled(Settings)`
  min-height: calc(100vh - var(--topBarHeight));
  position: relative;
  overflow-x: hidden;
  background: #ffffff;

  .container {
    position: relative;
    padding: 0px 20px;
  }

  .content-area {
    /* Add bottom padding to prevent content from being hidden behind sticky buttons */
    padding-bottom: 120px;
  }

  .success-message {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 30px;
    color: #10b981;
    font-weight: 600;

    .success-icon {
      font-size: 1.2rem;
    }
  }

  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 40px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 16px;
    padding: 8px;
    border: 2px solid rgba(0, 0, 0, 0.1);
  }

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 24px;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: rgba(0, 0, 0, 0.6);
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;

    .tab-icon {
      font-size: 1.1rem;
    }

    &:hover {
      color: rgba(0, 0, 0, 0.8);
      background: rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    }

    &.active {
      color: #333;
      background: rgba(98, 150, 211, 0.1);
      border: 2px solid rgba(98, 150, 211, 0.3);
      box-shadow: 0 4px 20px rgba(98, 150, 211, 0.15);
    }
  }

  .tab-content {
    min-height: 400px;
  }

  .section {
    margin-bottom: 50px;
  }

  .section-header {
    margin-bottom: 30px;

    h2 {
      margin: 0 0 10px 0;
      font-size: 1.8rem;
      color: #333;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: #666;
      font-size: 1rem;
      line-height: 1.5;
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }

  .form-group {
    margin-bottom: 30px;
  }

  label {
    display: block;
    margin-bottom: 12px;
    font-weight: 600;
    color: #333;
    font-size: 1rem;
    line-height: 1.4;

    .label-hint {
      display: block;
      font-weight: 400;
      font-size: 0.85rem;
      color: #666;
      margin-top: 2px;
    }
  }

  .input-wrapper {
    position: relative;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 16px 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.02);
    color: #333;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    font-family: inherit;
    box-sizing: border-box;

    &::placeholder {
      color: rgba(0, 0, 0, 0.4);
    }

    &:hover {
      border-color: rgba(0, 0, 0, 0.2);
      background: rgba(0, 0, 0, 0.04);
      transform: translateY(-1px);
    }

    &:focus {
      outline: none;
      border-color: rgba(98, 150, 211, 0.6);
      background: rgba(98, 150, 211, 0.05);
      box-shadow: 0 0 0 4px rgba(98, 150, 211, 0.1);
      transform: translateY(-2px);
    }

    &.error {
      border-color: rgba(239, 68, 68, 0.6);
      background: rgba(239, 68, 68, 0.05);
    }
  }

  select {
    cursor: pointer;

    option {
      background: #ffffff;
      color: #333;
      padding: 12px;
    }
  }

  textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.6;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ef4444;
    font-size: 13px;
    font-weight: 500;
    margin-top: 8px;

    &::before {
      content: "⚠️";
      font-size: 12px;
    }
  }

  .api-key-group {
    margin-bottom: 30px;
    padding: 24px;
    background: rgba(0, 0, 0, 0.02);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(0, 0, 0, 0.15);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
  }

  .api-key-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h3 {
      color: #333;
      margin: 0;
      font-weight: 700;
      font-size: 1.1rem;
    }
  }

  .status-badge {
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;

    &.success {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    &.error {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    &.testing {
      background: rgba(98, 150, 211, 0.2);
      color: #6296d3;
      border: 1px solid rgba(98, 150, 211, 0.3);
      animation: pulse 2s infinite;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  .api-key-input-group {
    display: flex;
    gap: 12px;
    align-items: flex-end;

    .input-wrapper {
      flex: 1;
    }
  }

  .test-btn {
    padding: 16px 24px;
    background: rgba(0, 0, 0, 0.05);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    color: #333;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover:not(:disabled) {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  /* Profile Management Styles */
  .profiles-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;

    h2 {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
      font-weight: 700;
    }

    p {
      color: #666;
      font-size: 1rem;
      margin-bottom: 15px;
    }

    .create-profile-btn {
      padding: 12px 24px;
      background: #6296d3;
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;

      &:hover {
        background: #5285c2;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(98, 150, 211, 0.3);
      }
    }
  }

  .profiles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    margin-top: 20px;
  }

  .profile-card {
    background: rgba(0, 0, 0, 0.02);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      transform: translateY(-3px);
      border-color: rgba(0, 0, 0, 0.15);
    }

    &.active {
      border: 2px solid #6296d3;
      box-shadow: 0 8px 24px rgba(98, 150, 211, 0.15);
      background: rgba(98, 150, 211, 0.02);
    }
  }

  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
      font-weight: 700;
    }

    .active-badge {
      background: rgba(98, 150, 211, 0.2);
      color: #6296d3;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border: 1px solid rgba(98, 150, 211, 0.3);
    }
  }

  .profile-description {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 15px;
  }

  .profile-meta {
    display: flex;
    justify-content: space-between;
    color: #888;
    font-size: 0.85rem;
    margin-bottom: 15px;
  }

  .profile-actions {
    display: flex;
    gap: 10px;
    margin-top: auto;

    button {
      padding: 8px 16px;
      border: none;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &.switch-btn {
        background: #6296d3;
        color: white;

        &:hover {
          background: #5285c2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(98, 150, 211, 0.3);
        }
      }

      &.edit-btn {
        background: #6b7280;
        color: white;

        &:hover {
          background: #52525b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
        }
      }

      &.delete-btn {
        background: #ef4444;
        color: white;

        &:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
      }
    }
  }

  .no-profiles {
    text-align: center;
    padding: 40px 0;
    color: #888;
    font-size: 1.1rem;
  }

  .profile-form-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .profile-form {
    background: #fff;
    border-radius: 20px;
    padding: 30px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    position: relative;
    z-index: 1001;
    border: 2px solid rgba(0, 0, 0, 0.1);
  }

  .profile-form h3 {
    margin-top: 0;
    margin-bottom: 25px;
    color: #333;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .profile-form .form-group {
    margin-bottom: 20px;
  }

  .profile-form label {
    margin-bottom: 10px;
    font-size: 1rem;
    color: #333;
    font-weight: 600;
  }

  .profile-form input,
  .profile-form textarea {
    width: 100%;
    padding: 14px 18px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.02);
    color: #333;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-sizing: border-box;

    &:hover {
      border-color: rgba(0, 0, 0, 0.2);
      background: rgba(0, 0, 0, 0.04);
    }

    &:focus {
      outline: none;
      border-color: rgba(98, 150, 211, 0.6);
      background: rgba(98, 150, 211, 0.05);
      box-shadow: 0 0 0 4px rgba(98, 150, 211, 0.1);
    }

    &.error {
      border-color: rgba(239, 68, 68, 0.6);
      background: rgba(239, 68, 68, 0.05);
    }
  }

  .profile-form .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 30px;
  }

  .profile-form .cancel-btn {
    padding: 12px 24px;
    background: rgba(0, 0, 0, 0.05);
    color: #333;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
  }

  .profile-form .submit-btn {
    padding: 12px 24px;
    background: #6296d3;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #5285c2;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(98, 150, 211, 0.3);
    }
  }

  /* Sticky Actions Bar */
  .sticky-actions {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: 1000;
    padding: 16px 20px;
    width: calc(100% - var(--sidebarWidth) - 4px);
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-top: 2px solid rgba(0, 0, 0, 0.1);
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    max-width: 100%;
    margin: 0 auto;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
    }
  }

  .reset-btn,
  .save-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    background-color: #6296d3;
    transition: all 0.3s ease;
    min-width: 160px;
  }

  .reset-btn {
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.7);
    border: 2px solid rgba(0, 0, 0, 0.1);

    &:hover {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.2);
      color: #333;
      transform: translateY(-2px);
    }
  }

  .save-btn {
    color: white;
    box-shadow: 0 8px 24px rgba(98, 150, 211, 0.3);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(98, 150, 211, 0.4);
      background-color: #5285c2;
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 20px 15px;
    }

    .content-area {
      padding-bottom: 140px; /* Extra padding on mobile for stacked buttons */
    }

    .section {
      margin-bottom: 40px;
    }

    .tabs {
      flex-direction: column;
      gap: 2px;
    }

    .api-key-input-group {
      flex-direction: column;
      gap: 16px;

      .test-btn {
        align-self: stretch;
      }
    }

    .sticky-actions {
      padding: 12px 15px;
      width: calc(100% - 30px);
    }

    .actions {
      .reset-btn,
      .save-btn {
        width: 100%;
        min-width: unset;
      }
    }

    /* Profile Management Mobile Styles */
    .profiles-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;

      .create-profile-btn {
        width: 100%;
      }
    }

    .profiles-grid {
      grid-template-columns: 1fr;
    }

    .profile-card {
      padding: 20px;
    }

    .profile-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .profile-description {
      font-size: 0.9rem;
    }

    .profile-meta {
      font-size: 0.8rem;
    }

    .profile-actions {
      flex-direction: column;
      gap: 10px;
    }

    .profile-form {
      padding: 25px;
      width: 95%;
    }

    .profile-form h3 {
      font-size: 1.6rem;
    }

    .profile-form .form-group {
      margin-bottom: 15px;
    }

    .profile-form label {
      margin-bottom: 8px;
      font-size: 0.95rem;
    }

    .profile-form input,
    .profile-form textarea {
      padding: 12px 16px;
      font-size: 14px;
    }

    .profile-form .form-actions {
      flex-direction: column;
      gap: 10px;
      margin-top: 25px;
    }

    .profile-form .cancel-btn,
    .profile-form .submit-btn {
      width: 100%;
      padding: 10px 16px;
    }
  }
`;
