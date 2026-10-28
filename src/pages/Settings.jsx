import { useEffect, useState } from "preact/hooks";
import styled from "styled-components";
import { KeyRound, PenLine, Trash2, User, X } from "lucide-preact";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";
import { PROVIDERS } from "../utils/models";
import ProviderLogo from "../components/ProviderLogo";
import { Toast, useToast } from "../components/Toast";

const emptyPersonalInfo = {
  name: "",
  email: "",
  phone: "",
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
};

const emptyPromptSettings = {
  customPromptPrefix: "",
  customPromptSuffix: "",
  maxWords: 500,
};

const normalizeSettings = (saved) => {
  const storedKeys = Array.isArray(saved?.apiKeys) ? saved.apiKeys : [];
  return {
    personalInfo: {
      ...emptyPersonalInfo,
      ...(saved?.personalInfo || {}),
    },
    promptSettings: {
      ...emptyPromptSettings,
      ...(saved?.promptSettings || {}),
    },
    apiKeys: PROVIDERS.map((provider) => {
      const found = storedKeys.find((key) => key.provider === provider.id);
      return {
        id: found?.id ?? provider.id,
        provider: provider.id,
        name: provider.name,
        apiKey: found?.apiKey || "",
        isValid: found?.isValid ?? null,
      };
    }),
  };
};

const keyLooksValid = (providerId, value) => {
  if (providerId === "openai") return value.startsWith("sk-") && value.length > 20;
  if (providerId === "anthropic") {
    return value.startsWith("sk-ant-") && value.length > 30;
  }
  return value.length > 10;
};

const maskKey = (value) => {
  const key = value.trim();
  if (key.length <= 8) return "Key saved";
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
};

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

const Settings = ({ className }) => {
  const [settings, setSettings] = useState(() =>
    normalizeSettings(getFromStorage(STORAGE_KEYS.SETTINGS, null)),
  );
  const [errors, setErrors] = useState({});
  const [keyEditor, setKeyEditor] = useState(null);
  const [keyDraft, setKeyDraft] = useState("");
  const [keyError, setKeyError] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const { toast, showToast } = useToast();

  useEffect(() => {
    setSettings(normalizeSettings(getFromStorage(STORAGE_KEYS.SETTINGS, null)));
  }, []);

  const persist = (next) => {
    const normalized = normalizeSettings(next);
    setSettings(normalized);
    saveToStorage(STORAGE_KEYS.SETTINGS, normalized);
    return normalized;
  };

  const handlePersonalInfoChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePromptSettingChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      promptSettings: { ...prev.promptSettings, [field]: value },
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const info = settings.personalInfo;

    if (!info.name.trim()) nextErrors.name = "Name is required";
    if (!info.email.trim()) nextErrors.email = "Email is required";
    else if (!isValidEmail(info.email)) nextErrors.email = "Enter a valid email";
    if (!isValidUrl(info.githubUrl)) nextErrors.githubUrl = "Enter a valid URL";
    if (!isValidUrl(info.linkedinUrl)) {
      nextErrors.linkedinUrl = "Enter a valid URL";
    }
    if (!isValidUrl(info.portfolioUrl)) {
      nextErrors.portfolioUrl = "Enter a valid URL";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      setActiveTab("personal");
      return;
    }
    persist(settings);
    showToast("Settings saved");
  };

  const resetToDefaults = () => {
    if (!confirm("Reset profile and prompt settings? API keys stay as they are.")) {
      return;
    }
    const next = normalizeSettings({
      ...settings,
      personalInfo: emptyPersonalInfo,
      promptSettings: emptyPromptSettings,
    });
    persist(next);
    setErrors({});
    showToast("Profile reset");
  };

  const openKeyEditor = (providerId) => {
    const entry = settings.apiKeys.find((key) => key.provider === providerId);
    setKeyEditor(providerId);
    setKeyDraft(entry?.apiKey || "");
    setKeyError("");
  };

  const closeKeyEditor = () => {
    setKeyEditor(null);
    setKeyDraft("");
    setKeyError("");
  };

  const saveKey = () => {
    const provider = PROVIDERS.find((item) => item.id === keyEditor);
    if (!provider) return;
    const value = keyDraft.trim();
    if (!keyLooksValid(provider.id, value)) {
      setKeyError(
        provider.id === "openai"
          ? "A ChatGPT key starts with sk-."
          : "A Claude key starts with sk-ant-.",
      );
      return;
    }

    const apiKeys = settings.apiKeys.map((key) =>
      key.provider === provider.id
        ? { ...key, name: provider.name, apiKey: value, isValid: true }
        : key,
    );
    persist({ ...settings, apiKeys });
    closeKeyEditor();
    showToast(`${provider.name} key saved`);
  };

  const removeKey = (providerId) => {
    const provider = PROVIDERS.find((item) => item.id === providerId);
    if (!provider) return;
    if (!confirm(`Remove the ${provider.name} API key?`)) return;
    const apiKeys = settings.apiKeys.map((key) =>
      key.provider === providerId
        ? { ...key, apiKey: "", isValid: null }
        : key,
    );
    persist({ ...settings, apiKeys });
    showToast(`${provider.name} key removed`);
  };

  const editingProvider = PROVIDERS.find((item) => item.id === keyEditor);

  return (
    <div className={className}>
      <header className="page-header">
        <p>Your profile, API keys, and how proposals are written.</p>
      </header>

      <div className="tabs" role="tablist" aria-label="Settings">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "personal"}
          className={activeTab === "personal" ? "active" : ""}
          onClick={() => setActiveTab("personal")}
        >
          <User size={16} />
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "api"}
          className={activeTab === "api" ? "active" : ""}
          onClick={() => setActiveTab("api")}
        >
          <KeyRound size={16} />
          API keys
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "prompts"}
          className={activeTab === "prompts" ? "active" : ""}
          onClick={() => setActiveTab("prompts")}
        >
          <PenLine size={16} />
          Prompt
        </button>
      </div>

      {activeTab === "personal" && (
      <section className="card">
        <div className="section-header">
          <div className="section-icon">
            <User size={18} />
          </div>
          <div>
            <h2>Profile</h2>
            <p>Added to the proposals you generate.</p>
          </div>
        </div>

        <div className="form-grid">
          <Field
            id="name"
            label="Full name"
            required
            value={settings.personalInfo.name}
            error={errors.name}
            placeholder="Your name"
            onInput={(value) => handlePersonalInfoChange("name", value)}
          />
          <Field
            id="email"
            label="Email"
            required
            type="email"
            value={settings.personalInfo.email}
            error={errors.email}
            placeholder="you@email.com"
            onInput={(value) => handlePersonalInfoChange("email", value)}
          />
          <Field
            id="phone"
            label="Phone"
            type="tel"
            value={settings.personalInfo.phone}
            placeholder="+1 555 123 4567"
            onInput={(value) => handlePersonalInfoChange("phone", value)}
          />
          <Field
            id="portfolioUrl"
            label="Portfolio"
            type="url"
            value={settings.personalInfo.portfolioUrl}
            error={errors.portfolioUrl}
            placeholder="https://yoursite.com"
            onInput={(value) => handlePersonalInfoChange("portfolioUrl", value)}
          />
          <Field
            id="githubUrl"
            label="GitHub"
            type="url"
            value={settings.personalInfo.githubUrl}
            error={errors.githubUrl}
            placeholder="https://github.com/you"
            onInput={(value) => handlePersonalInfoChange("githubUrl", value)}
          />
          <Field
            id="linkedinUrl"
            label="LinkedIn"
            type="url"
            value={settings.personalInfo.linkedinUrl}
            error={errors.linkedinUrl}
            placeholder="https://linkedin.com/in/you"
            onInput={(value) => handlePersonalInfoChange("linkedinUrl", value)}
          />
        </div>
      </section>
      )}

      {activeTab === "api" && (
      <section className="card">
        <div className="section-header">
          <div className="section-icon">
            <KeyRound size={18} />
          </div>
          <div>
            <h2>API keys</h2>
            <p>ChatGPT and Claude each need a key before they can write.</p>
          </div>
        </div>

        <ul className="key-list">
          {PROVIDERS.map((provider) => {
            const entry = settings.apiKeys.find(
              (key) => key.provider === provider.id,
            );
            const savedKey = entry?.apiKey?.trim() || "";
            return (
              <li key={provider.id} className="key-row">
                <div className="key-identity">
                  <ProviderLogo provider={provider.id} size={22} />
                  <div>
                    <h3>{provider.name}</h3>
                    <p>{savedKey ? maskKey(savedKey) : "No key saved"}</p>
                  </div>
                </div>
                <div className="key-actions">
                  {savedKey ? (
                    <>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => openKeyEditor(provider.id)}
                      >
                        <PenLine size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => removeKey(provider.id)}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => openKeyEditor(provider.id)}
                    >
                      Add key
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      )}

      {activeTab === "prompts" && (
      <section className="card">
        <div className="section-header">
          <div className="section-icon">
            <PenLine size={18} />
          </div>
          <div>
            <h2>Prompt</h2>
            <p>Text added around every generated proposal.</p>
          </div>
        </div>

        <label className="field">
          <span>Opening</span>
          <textarea
            rows={3}
            placeholder="As an experienced developer..."
            value={settings.promptSettings.customPromptPrefix}
            onInput={(event) =>
              handlePromptSettingChange("customPromptPrefix", event.target.value)
            }
          />
        </label>
        <label className="field">
          <span>Closing</span>
          <textarea
            rows={3}
            placeholder="I'm available to start immediately."
            value={settings.promptSettings.customPromptSuffix}
            onInput={(event) =>
              handlePromptSettingChange("customPromptSuffix", event.target.value)
            }
          />
        </label>
        <label className="field narrow">
          <span>
            Maximum words
            <small>Target length for a proposal</small>
          </span>
          <input
            type="number"
            min="100"
            max="2000"
            value={settings.promptSettings.maxWords}
            onInput={(event) =>
              handlePromptSettingChange(
                "maxWords",
                parseInt(event.target.value, 10) || 500,
              )
            }
          />
        </label>
      </section>
      )}

      {activeTab !== "api" && (
      <div className="page-actions">
        <button type="button" className="ghost-btn" onClick={resetToDefaults}>
          Reset profile
        </button>
        <button type="button" className="primary-btn" onClick={handleSave}>
          Save settings
        </button>
      </div>
      )}

      {editingProvider && (
        <div className="modal-overlay" onClick={closeKeyEditor}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="key-editor-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-heading">
                <ProviderLogo provider={editingProvider.id} size={22} />
                <h2 id="key-editor-title">
                  {settings.apiKeys.find((key) => key.provider === editingProvider.id)
                    ?.apiKey?.trim()
                    ? "Edit"
                    : "Add"}{" "}
                  {editingProvider.name} API key
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={closeKeyEditor}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <label className="field" htmlFor="provider-key">
              <span>API key</span>
              <input
                id="provider-key"
                type="text"
                autoComplete="off"
                placeholder={
                  editingProvider.id === "openai" ? "sk-..." : "sk-ant-..."
                }
                value={keyDraft}
                onInput={(event) => {
                  setKeyDraft(event.target.value);
                  if (keyError) setKeyError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    saveKey();
                  }
                }}
              />
            </label>
            {keyError && <p className="field-error">{keyError}</p>}
            <div className="modal-footer">
              <a href={editingProvider.keyUrl} target="_blank" rel="noreferrer">
                Get a {editingProvider.name} key
              </a>
              <div className="modal-actions">
                <button type="button" className="ghost-btn" onClick={closeKeyEditor}>
                  Cancel
                </button>
                <button type="button" className="primary-btn" onClick={saveKey}>
                  Save key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toast toast={toast} />
    </div>
  );
};

const Field = ({
  id,
  label,
  value,
  onInput,
  error,
  placeholder,
  type = "text",
  required = false,
}) => (
  <label className="field" htmlFor={id}>
    <span>
      {label}
      {required ? " *" : ""}
    </span>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onInput={(event) => onInput(event.target.value)}
    />
    {error && <small className="field-error">{error}</small>}
  </label>
);

export default styled(Settings)`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
  background: #ffffff;

  &,
  & * {
    box-sizing: border-box;
  }

  .page-header p {
    margin: 0;
    max-width: 40rem;
    color: #667085;
    font-size: 0.98rem;
    line-height: 1.5;
  }

  .tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid #e6e8ec;
    border-radius: 14px;
    background: #f7fafd;

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex: 1;
      height: 40px;
      padding: 0 12px;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: #667085;
      font-size: 0.92rem;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;

      &:hover {
        color: #1c1c1c;
      }

      &.active {
        background: #ffffff;
        color: #1c1c1c;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      }
    }
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 20px;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    background: #ffffff;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    h2 {
      margin: 0;
      color: #1c1c1c;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
    }

    p {
      margin: 4px 0 0;
      color: #667085;
      font-size: 0.9rem;
      line-height: 1.45;
    }
  }

  .section-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 12px;
    background: rgba(98, 150, 211, 0.12);
    color: #3969a0;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    &.narrow {
      max-width: 220px;
    }

    span {
      color: #1c1c1c;
      font-size: 0.88rem;
      font-weight: 700;
    }

    small {
      display: block;
      margin-top: 2px;
      color: #667085;
      font-size: 0.78rem;
      font-weight: 500;
    }

    input,
    textarea {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #e6e8ec;
      border-radius: 12px;
      background: #ffffff;
      color: #1c1c1c;
      font: inherit;
      font-size: 0.95rem;
      line-height: 1.4;

      &:focus {
        outline: none;
        border-color: #6296d3;
      }
    }

    textarea {
      resize: vertical;
      min-height: 88px;
    }
  }

  .field-error {
    margin: 0;
    color: #b91c1c;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .key-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .key-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;
  }

  .key-identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;

    h3 {
      margin: 0;
      color: #1c1c1c;
      font-size: 0.95rem;
      font-weight: 700;
    }

    p {
      margin: 2px 0 0;
      color: #667085;
      font-size: 0.84rem;
    }

    img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }
  }

  .key-actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
  }

  .primary-btn,
  .ghost-btn,
  .danger-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
  }

  .primary-btn {
    border: none;
    background: #6296d3;
    color: #ffffff;

    &:hover {
      background: #3969a0;
    }
  }

  .ghost-btn,
  .danger-btn {
    border: 1px solid #e6e8ec;
    background: #ffffff;
    color: #1c1c1c;

    &:hover {
      background: #f7fafd;
    }
  }

  .danger-btn {
    border-color: rgba(185, 28, 28, 0.28);
    color: #b91c1c;

    &:hover {
      background: rgba(185, 28, 28, 0.06);
    }
  }

  .page-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(28, 28, 28, 0.4);
  }

  .modal {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 100%;
    max-width: 440px;
    padding: 16px 16px 14px;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  }

  .modal-header,
  .modal-heading,
  .modal-footer,
  .modal-actions {
    display: flex;
    align-items: center;
  }

  .modal-header,
  .modal-footer {
    justify-content: space-between;
    gap: 12px;
  }

  .modal-heading {
    gap: 10px;
    min-width: 0;

    h2 {
      margin: 0;
      color: #1c1c1c;
      font-size: 1.02rem;
      font-weight: 700;
    }

    img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    padding: 0;
    border: 1px solid #e6e8ec;
    border-radius: 8px;
    background: #ffffff;
    color: #667085;
    cursor: pointer;

    &:hover {
      background: #f7fafd;
      color: #1c1c1c;
    }
  }

  .modal-footer a {
    color: #3969a0;
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .modal-actions {
    gap: 8px;
  }

  @media (max-width: 720px) {
    .form-grid {
      grid-template-columns: 1fr;
    }

    .field.narrow {
      max-width: none;
    }

    .key-row,
    .page-actions,
    .modal-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .tabs button {
      gap: 6px;
      padding: 0 8px;
      font-size: 0.84rem;
    }

    .key-actions,
    .modal-actions,
    .page-actions button,
    .key-actions button {
      width: 100%;
    }

    .modal-actions {
      flex-direction: column-reverse;
    }
  }
`;
