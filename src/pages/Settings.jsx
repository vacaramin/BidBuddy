import { useEffect, useRef, useState } from "preact/hooks";
import styled from "styled-components";
import {
  Check,
  KeyRound,
  Mail,
  PenLine,
  Phone,
  Trash2,
  User,
  X,
} from "lucide-preact";
import { getCurrentUrl, route, useRouter } from "preact-router";
import { PROVIDERS } from "../utils/models";
import ProviderLogo from "../components/ProviderLogo";
import ProfileAvatar from "../components/ProfileAvatar";
import { Toast, useToast } from "../components/Toast";
import {
  emptyPersonalInfo,
  emptyPromptSettings,
  getActiveProfile,
  getProfileById,
  loadStore,
  updateApiKeys,
  updateProfile,
  validatePersonalInfo,
} from "../utils/profiles";

const SETTINGS_TABS = ["personal", "api", "prompts"];

const tabFromUrl = (url = getCurrentUrl()) => {
  const query = (url.split("?")[1] || "").split("#")[0];
  const tab = new URLSearchParams(query).get("tab");
  if (tab === "profile") return "personal";
  if (tab === "prompt") return "prompts";
  return SETTINGS_TABS.includes(tab) ? tab : "personal";
};

const settingsPathForTab = (tab) =>
  tab === "personal" ? "/settings" : `/settings?tab=${tab}`;

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

const Settings = ({ className }) => {
  const [store, setStore] = useState(() => loadStore());
  const [draftPersonal, setDraftPersonal] = useState(() => {
    const initial = loadStore();
    return (
      getProfileById(initial, initial.activeProfileId)?.personalInfo ||
      emptyPersonalInfo
    );
  });
  const [draftPrompt, setDraftPrompt] = useState(() => {
    const initial = loadStore();
    return (
      getProfileById(initial, initial.activeProfileId)?.promptSettings ||
      emptyPromptSettings
    );
  });
  const [draftHeadline, setDraftHeadline] = useState(() => {
    const initial = loadStore();
    return getProfileById(initial, initial.activeProfileId)?.headline || "";
  });
  const [draftPhoto, setDraftPhoto] = useState(() => {
    const initial = loadStore();
    return getProfileById(initial, initial.activeProfileId)?.photo || "";
  });
  const [errors, setErrors] = useState({});
  const [dialog, setDialog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [keyError, setKeyError] = useState("");
  const closeTimerRef = useRef(null);
  const [router] = useRouter();
  const activeTab = tabFromUrl(router?.url || getCurrentUrl());
  const { toast, showToast } = useToast();

  const selectedProfile = getActiveProfile(store);
  const dialogProvider = PROVIDERS.find(
    (item) => item.id === dialog?.providerId,
  );

  const syncDraftFromProfile = (profile) => {
    if (!profile) return;
    setDraftPersonal({ ...emptyPersonalInfo, ...profile.personalInfo });
    setDraftPrompt({ ...emptyPromptSettings, ...profile.promptSettings });
    setDraftHeadline(profile.headline || "");
    setDraftPhoto(profile.photo || "");
    setErrors({});
  };

  const reloadFromStore = () => {
    const next = loadStore();
    setStore(next);
    syncDraftFromProfile(getActiveProfile(next));
  };

  useEffect(() => {
    reloadFromStore();
    const onChange = () => reloadFromStore();
    window.addEventListener("bidbuddy:profiles-changed", onChange);
    return () =>
      window.removeEventListener("bidbuddy:profiles-changed", onChange);
  }, []);

  const setActiveTab = (tab) => {
    const next = SETTINGS_TABS.includes(tab) ? tab : "personal";
    route(settingsPathForTab(next), true);
  };

  const handlePersonalInfoChange = (field, value) => {
    setDraftPersonal((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePromptSettingChange = (field, value) => {
    setDraftPrompt((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!selectedProfile) return;
    const nextErrors = validatePersonalInfo(draftPersonal);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setActiveTab("personal");
      return;
    }
    const next = updateProfile(store, selectedProfile.id, {
      headline: draftHeadline,
      photo: draftPhoto,
      personalInfo: draftPersonal,
      promptSettings: draftPrompt,
    });
    setStore(next);
    showToast("Profile saved");
  };

  const clearDialogFields = () => {
    setKeyDraft("");
    setKeyError("");
  };

  const closeDialog = () => {
    setDialogOpen(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setDialog(null);
      clearDialogFields();
      closeTimerRef.current = null;
    }, 200);
  };

  const openDialog = (nextDialog) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDialogOpen(false);
    setDialog(nextDialog);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    let openFrame;
    const mountFrame = requestAnimationFrame(() => {
      openFrame = requestAnimationFrame(() => setDialogOpen(true));
    });
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(mountFrame);
      if (openFrame) cancelAnimationFrame(openFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dialog?.type, dialog?.providerId]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const openResetProfile = () => {
    if (!selectedProfile) return;
    openDialog({ type: "reset" });
  };

  const openKeyEditor = (providerId) => {
    const entry = store.apiKeys.find((key) => key.provider === providerId);
    setKeyDraft(entry?.apiKey || "");
    setKeyError("");
    openDialog({ type: "edit-key", providerId });
  };

  const openRemoveKey = (providerId) => {
    openDialog({ type: "remove-key", providerId });
  };

  const confirmResetProfile = () => {
    if (!selectedProfile) return;
    const next = updateProfile(store, selectedProfile.id, {
      personalInfo: emptyPersonalInfo,
      promptSettings: emptyPromptSettings,
    });
    setStore(next);
    syncDraftFromProfile(getProfileById(next, selectedProfile.id));
    closeDialog();
    showToast("Profile reset");
  };

  const saveKey = () => {
    const provider = dialogProvider;
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

    const apiKeys = store.apiKeys.map((key) =>
      key.provider === provider.id
        ? { ...key, name: provider.name, apiKey: value, isValid: true }
        : key,
    );
    const next = updateApiKeys(store, apiKeys);
    setStore(next);
    closeDialog();
    showToast(`${provider.name} key saved`);
  };

  const confirmRemoveKey = () => {
    const provider = dialogProvider;
    if (!provider) return;
    const apiKeys = store.apiKeys.map((key) =>
      key.provider === provider.id
        ? { ...key, apiKey: "", isValid: null }
        : key,
    );
    const next = updateApiKeys(store, apiKeys);
    setStore(next);
    closeDialog();
    showToast(`${provider.name} key removed`);
  };

  return (
    <div className={className}>
      <header className="page-header">
        <p>
          Edit the active profile from the top bar, plus shared API keys and
          prompt settings.
        </p>
      </header>

      <div className="tabs" role="tablist" aria-label="Profile setup">
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
        <>
          <section className="card profile-preview-card">
            <div className="profile-preview">
              <ProfileAvatar
                photo={draftPhoto}
                name={selectedProfile?.name || draftPersonal.name}
                size={64}
              />
              <div className="profile-preview-copy">
                <strong>{selectedProfile?.name || "Profile"}</strong>
                {draftHeadline ? <span>{draftHeadline}</span> : null}
              </div>
            </div>
          </section>

          <section className="card">
            <div className="form-grid">
              <Field
                id="name"
                label="Full name"
                required
                value={draftPersonal.name}
                error={errors.name}
                placeholder="Your name"
                onInput={(value) => handlePersonalInfoChange("name", value)}
              />
              <Field
                id="headline"
                label="Headline"
                value={draftHeadline}
                placeholder="Freelance B2B copywriter"
                onInput={setDraftHeadline}
              />
              <Field
                id="email"
                label="Email"
                required
                type="email"
                value={draftPersonal.email}
                error={errors.email}
                placeholder="you@email.com"
                onInput={(value) => handlePersonalInfoChange("email", value)}
              />
              <Field
                id="phone"
                label="Phone"
                type="tel"
                value={draftPersonal.phone}
                placeholder="+1 555 123 4567"
                onInput={(value) => handlePersonalInfoChange("phone", value)}
              />
              <Field
                id="portfolioUrl"
                label="Portfolio"
                type="url"
                value={draftPersonal.portfolioUrl}
                error={errors.portfolioUrl}
                placeholder="https://yoursite.com"
                onInput={(value) =>
                  handlePersonalInfoChange("portfolioUrl", value)
                }
              />
              <Field
                id="githubUrl"
                label="GitHub"
                type="url"
                value={draftPersonal.githubUrl}
                error={errors.githubUrl}
                placeholder="https://github.com/you"
                onInput={(value) =>
                  handlePersonalInfoChange("githubUrl", value)
                }
              />
              <Field
                id="linkedinUrl"
                label="LinkedIn"
                type="url"
                value={draftPersonal.linkedinUrl}
                error={errors.linkedinUrl}
                placeholder="https://linkedin.com/in/you"
                onInput={(value) =>
                  handlePersonalInfoChange("linkedinUrl", value)
                }
              />
            </div>
          </section>
        </>
      )}

      {activeTab === "api" && (
        <section className="card">
          <div className="section-header">
            <div className="section-icon">
              <KeyRound size={18} />
            </div>
            <div>
              <h2>API keys</h2>
              <p>
                Shared across all profiles. ChatGPT and Claude each need a key
                before they can write.
              </p>
            </div>
          </div>

          <ul className="key-list">
            {PROVIDERS.map((provider) => {
              const entry = store.apiKeys.find(
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
                          onClick={() => openRemoveKey(provider.id)}
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
              <p>
                Text added around proposals generated with “
                {selectedProfile?.name || "this profile"}”.
              </p>
            </div>
          </div>

          <label className="field">
            <span>Opening</span>
            <textarea
              rows={3}
              placeholder="As an experienced developer..."
              value={draftPrompt.customPromptPrefix}
              onInput={(event) =>
                handlePromptSettingChange(
                  "customPromptPrefix",
                  event.target.value,
                )
              }
            />
          </label>
          <label className="field">
            <span>Closing</span>
            <textarea
              rows={3}
              placeholder="I'm available to start immediately."
              value={draftPrompt.customPromptSuffix}
              onInput={(event) =>
                handlePromptSettingChange(
                  "customPromptSuffix",
                  event.target.value,
                )
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
              value={draftPrompt.maxWords}
              onInput={(event) =>
                handlePromptSettingChange(
                  "maxWords",
                  parseInt(event.target.value, 10) || 500,
                )
              }
            />
          </label>

          <div className="include-block">
            <span className="include-label">
              Include contact details
              <small>Leave off unless the job asks for them</small>
            </span>
            <div className="include-row">
              <button
                type="button"
                className={`include-chip${draftPrompt.includeEmail ? " on" : ""}`}
                aria-pressed={draftPrompt.includeEmail}
                onClick={() =>
                  handlePromptSettingChange(
                    "includeEmail",
                    !draftPrompt.includeEmail,
                  )
                }
              >
                <span
                  className={`include-check${
                    draftPrompt.includeEmail ? " checked" : ""
                  }`}
                  aria-hidden="true"
                >
                  {draftPrompt.includeEmail && <Check size={12} />}
                </span>
                <Mail size={14} />
                Email
              </button>
              <button
                type="button"
                className={`include-chip${draftPrompt.includePhone ? " on" : ""}`}
                aria-pressed={draftPrompt.includePhone}
                onClick={() =>
                  handlePromptSettingChange(
                    "includePhone",
                    !draftPrompt.includePhone,
                  )
                }
              >
                <span
                  className={`include-check${
                    draftPrompt.includePhone ? " checked" : ""
                  }`}
                  aria-hidden="true"
                >
                  {draftPrompt.includePhone && <Check size={12} />}
                </span>
                <Phone size={14} />
                Phone
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab !== "api" && (
        <div className="page-actions">
          <button type="button" className="ghost-btn" onClick={openResetProfile}>
            Reset profile
          </button>
          <button type="button" className="primary-btn" onClick={handleSave}>
            Save profile
          </button>
        </div>
      )}

      {dialog && (
        <div
          className={`modal-overlay${dialogOpen ? " open" : ""}`}
          onClick={closeDialog}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {dialog.type === "reset" && (
              <>
                <div className="modal-header">
                  <h2 id="settings-dialog-title">Reset profile</h2>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={closeDialog}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="modal-copy">
                  Reset “{selectedProfile?.name}” personal info and prompt
                  settings? API keys stay as they are.
                </p>
                <div className="modal-footer end">
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={closeDialog}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={confirmResetProfile}
                    >
                      Reset profile
                    </button>
                  </div>
                </div>
              </>
            )}

            {dialog.type === "edit-key" && dialogProvider && (
              <>
                <div className="modal-header">
                  <div className="modal-heading">
                    <ProviderLogo provider={dialogProvider.id} size={22} />
                    <h2 id="settings-dialog-title">
                      {store.apiKeys.find(
                        (key) => key.provider === dialogProvider.id,
                      )?.apiKey?.trim()
                        ? "Edit"
                        : "Add"}{" "}
                      {dialogProvider.name} API key
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={closeDialog}
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
                    autoFocus
                    placeholder={
                      dialogProvider.id === "openai" ? "sk-..." : "sk-ant-..."
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
                  <a
                    href={dialogProvider.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get a {dialogProvider.name} key
                  </a>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={closeDialog}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={saveKey}
                    >
                      Save key
                    </button>
                  </div>
                </div>
              </>
            )}

            {dialog.type === "remove-key" && dialogProvider && (
              <>
                <div className="modal-header">
                  <div className="modal-heading">
                    <ProviderLogo provider={dialogProvider.id} size={22} />
                    <h2 id="settings-dialog-title">
                      Remove {dialogProvider.name} key
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={closeDialog}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="modal-copy">
                  Remove the shared {dialogProvider.name} API key? Profiles
                  won’t be able to generate with {dialogProvider.name} until you
                  add a key again.
                </p>
                <div className="modal-footer end">
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={closeDialog}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="danger-btn solid"
                      onClick={confirmRemoveKey}
                    >
                      Remove key
                    </button>
                  </div>
                </div>
              </>
            )}
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

  .profile-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #e6e8ec;
    background: #ffffff;
    color: #3969a0;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1;
    overflow: hidden;

    &.placeholder {
      background: rgba(98, 150, 211, 0.12);
    }
  }

  .profile-preview-card {
    padding: 16px 20px;
  }

  .profile-preview {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .profile-preview-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    strong {
      color: #1c1c1c;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
    }

    span {
      color: #667085;
      font-size: 0.9rem;
      line-height: 1.35;
    }
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

  .include-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  .include-label {
    color: #1c1c1c;
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.3;

    small {
      display: block;
      margin-top: 2px;
      color: #667085;
      font-size: 0.8rem;
      font-weight: 500;
      line-height: 1.35;
    }
  }

  .include-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .include-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 0 10px;
    border: 1px solid #e6e8ec;
    border-radius: 8px;
    background: #ffffff;
    color: #667085;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: #f7fafd;
    }

    &.on {
      border-color: rgba(98, 150, 211, 0.45);
      background: rgba(98, 150, 211, 0.1);
      color: #3969a0;
    }
  }

  .include-check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border: 1.5px solid #d0d5dd;
    border-radius: 4px;
    background: #ffffff;
    color: #ffffff;

    &.checked {
      border-color: #6296d3;
      background: #6296d3;
    }
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

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  .primary-btn {
    border: none;
    background: #6296d3;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #3969a0;
    }
  }

  .ghost-btn,
  .danger-btn {
    border: 1px solid #e6e8ec;
    background: #ffffff;
    color: #1c1c1c;

    &:hover:not(:disabled) {
      background: #f7fafd;
    }
  }

  .danger-btn {
    border-color: rgba(185, 28, 28, 0.28);
    color: #b91c1c;

    &:hover:not(:disabled) {
      background: rgba(185, 28, 28, 0.06);
    }

    &.solid {
      border: none;
      background: #b91c1c;
      color: #ffffff;

      &:hover:not(:disabled) {
        background: #991b1b;
      }
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
    opacity: 0;
    transition: opacity 0.2s ease;

    &.open {
      opacity: 1;

      .modal {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
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
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .modal-copy {
    margin: 0;
    color: #667085;
    font-size: 0.95rem;
    line-height: 1.5;
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

  .modal-footer.end {
    justify-content: flex-end;
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

  .modal-header > h2 {
    margin: 0;
    color: #1c1c1c;
    font-size: 1.02rem;
    font-weight: 700;
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
