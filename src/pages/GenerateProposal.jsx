import { useState, useEffect, useRef } from "preact/hooks";
import styled from "styled-components";
import {
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Play,
  RefreshCw,
  X,
} from "lucide-preact";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";
import { ApiService } from "../utils/apiService";
import { getDefaultModel, getModels, PROVIDERS } from "../utils/models";
import ProviderLogo from "../components/ProviderLogo";
import { Toast, copyText, useToast } from "../components/Toast";
import { getCurrentUrl, route, useRouter } from "preact-router";

const resultIdFromUrl = (url = getCurrentUrl()) => {
  const query = (url.split("?")[1] || "").split("#")[0];
  return new URLSearchParams(query).get("id");
};

const DEADLINE_OPTIONS = [
  { value: "", label: "Deadline" },
  { value: "asap", label: "As soon as possible" },
  { value: "1_week", label: "Within a week" },
  { value: "2_weeks", label: "Within 2 weeks" },
  { value: "1_month", label: "Within a month" },
  { value: "flexible", label: "Flexible" },
  { value: "custom", label: "Custom deadline" },
];

const BUDGET_OPTIONS = [
  { value: "", label: "Budget" },
  { value: "discuss", label: "Prefer to discuss" },
  { value: "hourly", label: "Hourly" },
  { value: "under_500", label: "Under $500" },
  { value: "500_2000", label: "$500–$2,000" },
  { value: "2000_5000", label: "$2,000–$5,000" },
  { value: "5000_10000", label: "$5,000–$10,000" },
  { value: "10000_plus", label: "$10,000+" },
  { value: "custom", label: "Custom budget" },
];

const START_OPTIONS = [
  { value: "", label: "Start" },
  { value: "immediately", label: "Immediately" },
  { value: "this_week", label: "This week" },
  { value: "next_week", label: "Next week" },
  { value: "tbd", label: "To be agreed" },
];

const emptyBidFields = {
  deadline: "",
  deadlineCustom: "",
  includeDeadline: false,
  budget: "",
  budgetCustom: "",
  includeBudget: false,
  start: "",
  includeStart: false,
};

const createEmptyForm = () => ({
  project_description: "",
  llm_model: getDefaultModel("openai"),
  llm_provider: "openai",
  additional_notes: "",
  ...emptyBidFields,
});

const optionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || "";

const resolveBidValue = (value, custom, options) => {
  if (!value) return "";
  if (value === "custom") {
    const trimmed = custom.trim();
    return trimmed || "";
  }
  return optionLabel(options, value) || value;
};

const GenerateProposal = ({ className }) => {
  const [formData, setFormData] = useState(createEmptyForm);

  const [settings, setSettings] = useState(null);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [keyProviderId, setKeyProviderId] = useState(null);
  const [keyModalProvider, setKeyModalProvider] = useState(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [keyError, setKeyError] = useState("");
  const keyInputRef = useRef(null);
  const descriptionRef = useRef(null);
  const skipResultClear = useRef(true);
  const [router] = useRouter();
  const { toast, showToast } = useToast();
  const resultId = resultIdFromUrl(router?.url || getCurrentUrl());

  const resizeDescription = (element) => {
    if (!element) return;
    const current = element.offsetHeight;
    element.style.transition = "none";
    element.style.height = "auto";
    const border = element.offsetHeight - element.clientHeight;
    const next = element.scrollHeight + border;
    element.style.height = `${current}px`;
    element.style.transition = "";
    requestAnimationFrame(() => {
      element.style.height = `${next}px`;
    });
  };

  useEffect(() => {
    resizeDescription(descriptionRef.current);
  }, [formData.project_description]);

  const providerHasKey = (providerId, source = settings) => {
    const entry = source?.apiKeys?.find((key) => key.provider === providerId);
    return Boolean(entry?.apiKey?.trim());
  };

  useEffect(() => {
    if (!resultId) {
      if (skipResultClear.current) {
        skipResultClear.current = false;
        return;
      }
      setFormData(createEmptyForm());
      setGeneratedProposal("");
      setGeneratedPrompt("");
      setGenerationError("");
      setPromptOpen(false);
      setShowResults(false);
      setErrors({});
      return;
    }

    skipResultClear.current = false;
    const saved = getFromStorage(STORAGE_KEYS.PROPOSALS, []);
    const found = saved.find((item) => String(item.id) === String(resultId));
    if (!found) return;

    setFormData({
      ...createEmptyForm(),
      project_description: found.project_description || "",
      additional_notes: found.additional_notes || "",
      llm_provider: found.llm_provider || "openai",
      llm_model:
        found.llm_model || getDefaultModel(found.llm_provider || "openai"),
      deadline: found.deadline || "",
      deadlineCustom: found.deadlineCustom || "",
      includeDeadline: Boolean(found.includeDeadline),
      budget: found.budget || "",
      budgetCustom: found.budgetCustom || "",
      includeBudget: Boolean(found.includeBudget),
      start: found.start || "",
      includeStart: Boolean(found.includeStart),
    });
    setGeneratedPrompt(found.prompt_used || "");
    setGeneratedProposal(found.generated_proposal || "");
    setGenerationError(found.generation_error || "");
    setPromptOpen(false);
    setShowResults(true);
  }, [resultId]);

  useEffect(() => {
    const savedSettings = getFromStorage(STORAGE_KEYS.SETTINGS);
    setSettings(savedSettings);
    const openaiReady = Boolean(
      savedSettings?.apiKeys?.find(
        (key) => key.provider === "openai" && key.apiKey?.trim(),
      ),
    );
    const claudeReady = Boolean(
      savedSettings?.apiKeys?.find(
        (key) => key.provider === "anthropic" && key.apiKey?.trim(),
      ),
    );
    if (!openaiReady && claudeReady) {
      setFormData((prev) => ({
        ...prev,
        llm_provider: "anthropic",
        llm_model: getDefaultModel("anthropic"),
      }));
    }
  }, []);

  useEffect(() => {
    if (keyProviderId) {
      setKeyModalProvider(keyProviderId);
      return;
    }
    setKeyModalOpen(false);
    const hideTimer = setTimeout(() => {
      setKeyModalProvider(null);
      setKeyDraft("");
      setKeyError("");
    }, 220);
    return () => clearTimeout(hideTimer);
  }, [keyProviderId]);

  useEffect(() => {
    if (!keyModalProvider || keyModalProvider !== keyProviderId) return;
    let openFrame;
    const mountFrame = requestAnimationFrame(() => {
      openFrame = requestAnimationFrame(() => setKeyModalOpen(true));
    });
    keyInputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setKeyProviderId(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(mountFrame);
      if (openFrame) cancelAnimationFrame(openFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [keyModalProvider, keyProviderId]);

  const handleInputChange = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "deadline") {
        next.includeDeadline = Boolean(value);
        if (value !== "custom") next.deadlineCustom = "";
      }
      if (name === "budget") {
        next.includeBudget = Boolean(value);
        if (value !== "custom") next.budgetCustom = "";
      }
      if (name === "start") {
        next.includeStart = Boolean(value);
      }

      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.project_description.trim()) {
      newErrors.project_description = "Please describe the project!";
    }
    if (!formData.llm_model) {
      newErrors.llm_model = "Please select an LLM model!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPrompt = () => {
    const personalInfo = settings?.personalInfo || {};
    const promptSettings = settings?.promptSettings || {};

    const deadlineText = resolveBidValue(
      formData.deadline,
      formData.deadlineCustom,
      DEADLINE_OPTIONS,
    );
    const budgetText = resolveBidValue(
      formData.budget,
      formData.budgetCustom,
      BUDGET_OPTIONS,
    );
    const startText = resolveBidValue(
      formData.start,
      "",
      START_OPTIONS,
    );

    const includeDeadline = formData.includeDeadline && Boolean(deadlineText);
    const includeBudget = formData.includeBudget && Boolean(budgetText);
    const includeStart = formData.includeStart && Boolean(startText);

    const weaveLines = [];
    if (includeDeadline) {
      weaveLines.push(
        `- Mention a project deadline of "${deadlineText}" naturally in the letter.`,
      );
    } else {
      weaveLines.push("- Do not mention a deadline.");
    }
    if (includeBudget) {
      weaveLines.push(
        `- Mention a budget of "${budgetText}" naturally in the letter.`,
      );
    } else {
      weaveLines.push("- Do not mention budget.");
    }
    if (includeStart) {
      weaveLines.push(
        `- Mention availability to start "${startText}" naturally in the letter.`,
      );
    } else {
      weaveLines.push("- Do not mention a start date.");
    }

    let prompt = `${promptSettings.customPromptPrefix || ""}  

I need you to write a compelling project proposal based on the following project description:

"${formData.project_description}"

${formData.additional_notes ? `Additional context: ${formData.additional_notes}` : ""}

Please create a proposal that includes my personal details and is approximately ${promptSettings.maxWords || 500} words.
Introduce me using the profile below in whatever way fits this job.
Do not add a title, heading, or labeled sections such as "Deadline" or "Budget".
Weave any of the following facts into the prose only when instructed:

${weaveLines.join("\n")}
${
  promptSettings.includeEmail
    ? personalInfo.email
      ? `- You may include this email: ${personalInfo.email}`
      : ""
    : "- Do not include any email address."
}
${
  promptSettings.includePhone
    ? personalInfo.phone
      ? `- You may include this phone number: ${personalInfo.phone}`
      : ""
    : "- Do not include any phone number."
}

${personalInfo.name ? `My name is ${personalInfo.name}.` : ""}
${personalInfo.portfolioUrl ? `Portfolio: ${personalInfo.portfolioUrl}` : ""}
${personalInfo.githubUrl ? `GitHub: ${personalInfo.githubUrl}` : ""}
${personalInfo.linkedinUrl ? `LinkedIn: ${personalInfo.linkedinUrl}` : ""}

${promptSettings.customPromptSuffix || ""}`;

    return prompt;
  };

  const getApiKey = () => {
    const entry = settings?.apiKeys?.find(
      (key) => key.provider === formData.llm_provider,
    );
    return entry?.apiKey?.trim() || null;
  };

  const keyLooksValid = (providerId, value) => {
    if (providerId === "openai")
      return value.startsWith("sk-") && value.length > 20;
    if (providerId === "anthropic") {
      return value.startsWith("sk-ant-") && value.length > 30;
    }
    return value.length > 10;
  };

  const openKeyForm = (providerId) => {
    setKeyProviderId(providerId);
    setKeyDraft("");
    setKeyError("");
  };

  const closeKeyForm = () => {
    setKeyProviderId(null);
  };

  const chooseProvider = (provider) => {
    if (!providerHasKey(provider.id)) {
      openKeyForm(provider.id);
      return;
    }
    closeKeyForm();
    handleInputChange("llm_provider", provider.id);
    handleInputChange("llm_model", provider.defaultModel);
  };

  const saveProviderKey = () => {
    const provider = PROVIDERS.find((item) => item.id === keyProviderId);
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

    const current = settings || {};
    const personalInfo = {
      name: "",
      email: "",
      phone: "",
      githubUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
      ...(current.personalInfo || {}),
    };
    const storedPrompt = current.promptSettings || {};
    const promptSettings = {
      customPromptPrefix: "",
      customPromptSuffix: "",
      maxWords: 500,
      ...storedPrompt,
      includeEmail: storedPrompt.includeEmail === true,
      includePhone: storedPrompt.includePhone === true,
    };
    const apiKeys = Array.isArray(current.apiKeys) ? [...current.apiKeys] : [];
    const index = apiKeys.findIndex((key) => key.provider === provider.id);
    if (index >= 0) {
      apiKeys[index] = { ...apiKeys[index], apiKey: value, isValid: true };
    } else {
      apiKeys.push({
        id: Date.now(),
        provider: provider.id,
        name: provider.name,
        apiKey: value,
        isValid: true,
      });
    }
    const nextSettings = {
      ...current,
      personalInfo,
      promptSettings,
      apiKeys,
    };
    saveToStorage(STORAGE_KEYS.SETTINGS, nextSettings);
    setSettings(nextSettings);
    handleInputChange("llm_provider", provider.id);
    handleInputChange("llm_model", provider.defaultModel);
    closeKeyForm();
  };

  const openSavedResult = (proposalContent, prompt, errorMessage = "", replaceId) => {
    const existingProposals = getFromStorage(STORAGE_KEYS.PROPOSALS, []);
    const replaceIndex = replaceId
      ? existingProposals.findIndex(
          (item) => String(item.id) === String(replaceId),
        )
      : -1;

    if (replaceIndex >= 0) {
      const next = [...existingProposals];
      next[replaceIndex] = {
        ...next[replaceIndex],
        llm_provider: formData.llm_provider,
        llm_model: formData.llm_model,
        deadline: formData.deadline,
        deadlineCustom: formData.deadlineCustom,
        includeDeadline: formData.includeDeadline,
        budget: formData.budget,
        budgetCustom: formData.budgetCustom,
        includeBudget: formData.includeBudget,
        start: formData.start,
        includeStart: formData.includeStart,
        prompt_used: prompt,
        generated_proposal: proposalContent || "",
        generation_error: errorMessage || "",
      };
      saveToStorage(STORAGE_KEYS.PROPOSALS, next);
    } else {
      const proposal = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        project_description: formData.project_description,
        additional_notes: formData.additional_notes,
        llm_provider: formData.llm_provider,
        llm_model: formData.llm_model,
        deadline: formData.deadline,
        deadlineCustom: formData.deadlineCustom,
        includeDeadline: formData.includeDeadline,
        budget: formData.budget,
        budgetCustom: formData.budgetCustom,
        includeBudget: formData.includeBudget,
        start: formData.start,
        includeStart: formData.includeStart,
        prompt_used: prompt,
        generated_proposal: proposalContent || "",
        generation_error: errorMessage || "",
      };
      saveToStorage(STORAGE_KEYS.PROPOSALS, [proposal, ...existingProposals]);
      route(`/proposal?id=${proposal.id}`);
    }

    setGeneratedProposal(proposalContent || "");
    setGenerationError(errorMessage || "");
    setGeneratedPrompt(prompt);
    setPromptOpen(false);
    setShowResults(true);
  };

  const generateProposal = async (prompt, replaceId) => {
    const apiKey = getApiKey();

    if (!apiKey) {
      openSavedResult(
        "",
        prompt,
        replaceId ? "Add an API key to retry this proposal." : "",
        replaceId,
      );
      return;
    }

    setIsGenerating(true);
    setShowResults(false);

    try {
      let response;
      let proposalContent = "";
      const messages = [{ role: "user", content: prompt }];

      if (formData.llm_provider === "openai") {
        response = await ApiService.callOpenAI(
          apiKey,
          messages,
          formData.llm_model,
        );
        proposalContent =
          response.choices[0]?.message?.content || "No response generated";
      } else if (formData.llm_provider === "anthropic") {
        const claudeMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        response = await ApiService.callClaude(
          apiKey,
          claudeMessages,
          formData.llm_model,
        );
        proposalContent = response.content[0]?.text || "No response generated";
      }

      openSavedResult(proposalContent, prompt, "", replaceId);
    } catch (error) {
      console.error("Error generating proposal:", error);
      openSavedResult(
        "",
        prompt,
        `Error generating proposal: ${error.message}`,
        replaceId,
      );
    } finally {
      setIsGenerating(false);
      setPromptOpen(false);
      setShowResults(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const prompt = buildPrompt();
    setGeneratedPrompt(prompt);
    await generateProposal(prompt);
  };

  const retryGeneration = async () => {
    if (isGenerating) return;
    if (!formData.project_description.trim()) return;
    if (!formData.llm_model) return;

    const prompt = buildPrompt();
    setGeneratedPrompt(prompt);
    await generateProposal(prompt, resultId);
  };

  const copyToClipboard = async (text) => {
    const copied = await copyText(text);
    showToast(copied ? "Copied" : "Couldn't copy", copied ? "success" : "error");
  };

  const resetForm = () => {
    setFormData(createEmptyForm());
    setGeneratedProposal("");
    setGeneratedPrompt("");
    setGenerationError("");
    setPromptOpen(false);
    setShowResults(false);
    setErrors({});
    if (getCurrentUrl().includes("?")) route("/proposal");
  };

  const hasValidApiKey = () => {
    return getApiKey() !== null;
  };

  const providersWithKeys = PROVIDERS.filter((provider) =>
    providerHasKey(provider.id),
  );
  if (isGenerating) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - var(--topBarHeight))",
        }}
      >
        <div class="loader"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="container">
        {!showResults ? (
          <div className="proposal-card">
            <form
              className={`proposal-form${
                formData.project_description.trim() ? " has-submit" : ""
              }`}
              onSubmit={handleSubmit}
            >
              <div className="section">
                <div className="form-group">
                  <label htmlFor="project_description">
                    Project Description *
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="project_description"
                      ref={descriptionRef}
                      rows={4}
                      placeholder="Paste the project description from the job posting or describe your project in detail..."
                      value={formData.project_description}
                      onChange={(e) =>
                        handleInputChange("project_description", e.target.value)
                      }
                      className={errors.project_description ? "error" : ""}
                    />
                    <div className="input-border"></div>
                  </div>
                  {errors.project_description && (
                    <span className="error-message">
                      {errors.project_description}
                    </span>
                  )}
                </div>

                <div className="bid-row">
                  <label className="select-wrap">
                    <CalendarClock
                      className="select-icon"
                      size={16}
                      aria-hidden="true"
                    />
                    <select
                      aria-label="Deadline"
                      value={formData.deadline}
                      onChange={(e) =>
                        handleInputChange("deadline", e.target.value)
                      }
                    >
                      {DEADLINE_OPTIONS.map((option) => (
                        <option
                          key={option.value || "deadline-none"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="select-chevron"
                      size={16}
                      aria-hidden="true"
                    />
                  </label>
                  {formData.deadline === "custom" && (
                    <input
                      className="bid-custom"
                      type="text"
                      aria-label="Custom deadline"
                      placeholder="Custom deadline"
                      value={formData.deadlineCustom}
                      onChange={(e) =>
                        handleInputChange("deadlineCustom", e.target.value)
                      }
                    />
                  )}

                  <label className="select-wrap">
                    <CircleDollarSign
                      className="select-icon"
                      size={16}
                      aria-hidden="true"
                    />
                    <select
                      aria-label="Budget"
                      value={formData.budget}
                      onChange={(e) =>
                        handleInputChange("budget", e.target.value)
                      }
                    >
                      {BUDGET_OPTIONS.map((option) => (
                        <option
                          key={option.value || "budget-none"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="select-chevron"
                      size={16}
                      aria-hidden="true"
                    />
                  </label>
                  {formData.budget === "custom" && (
                    <input
                      className="bid-custom"
                      type="text"
                      aria-label="Custom budget"
                      placeholder="Custom budget"
                      value={formData.budgetCustom}
                      onChange={(e) =>
                        handleInputChange("budgetCustom", e.target.value)
                      }
                    />
                  )}

                  <label className="select-wrap">
                    <Play
                      className="select-icon"
                      size={16}
                      aria-hidden="true"
                    />
                    <select
                      aria-label="Start"
                      value={formData.start}
                      onChange={(e) =>
                        handleInputChange("start", e.target.value)
                      }
                    >
                      {START_OPTIONS.map((option) => (
                        <option
                          key={option.value || "start-none"}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="select-chevron"
                      size={16}
                      aria-hidden="true"
                    />
                  </label>
                </div>
              </div>

              <div className="section">
                <div
                  className={`form-row ${
                    providerHasKey(formData.llm_provider) ? "" : "providers-only"
                  }`}
                >
                  <div className="form-group">
                    <label id="llm_provider-label">AI Provider *</label>
                    <div
                      className="provider-choices"
                      role="radiogroup"
                      aria-labelledby="llm_provider-label"
                    >
                      {PROVIDERS.map((provider) => {
                        const hasKey = providerHasKey(provider.id);
                        const selected =
                          hasKey && formData.llm_provider === provider.id;
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            aria-disabled={!hasKey}
                            className={`provider-choice ${selected ? "active" : ""} ${
                              hasKey ? "" : "locked"
                            }`}
                            onClick={() => chooseProvider(provider)}
                          >
                            <ProviderLogo provider={provider.id} />
                            <span className="provider-copy">
                              <span>{provider.name}</span>
                              {!hasKey && (
                                <span className="provider-hint">Add key</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {providerHasKey(formData.llm_provider) && (
                    <div className="form-group">
                      <label htmlFor="llm_model">AI Model *</label>
                      <div
                        className={`input-wrapper model-field${
                          errors.llm_model ? " error" : ""
                        }`}
                      >
                        <ProviderLogo provider={formData.llm_provider} />
                        <select
                          id="llm_model"
                          value={formData.llm_model}
                          onChange={(e) =>
                            handleInputChange("llm_model", e.target.value)
                          }
                        >
                          {getModels(formData.llm_provider).map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                              {model.note ? ` — ${model.note}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} aria-hidden="true" />
                      </div>
                      {errors.llm_model && (
                        <span className="error-message">
                          {errors.llm_model}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="additional_notes">Additional Notes</label>
                  <div className="input-wrapper">
                    <textarea
                      id="additional_notes"
                      rows={3}
                      placeholder="Share any other requirements or special points you want to highlight..."
                      value={formData.additional_notes}
                      onChange={(e) =>
                        handleInputChange("additional_notes", e.target.value)
                      }
                    />
                    <div className="input-border"></div>
                  </div>
                </div>
              </div>

              <div
                className={`submit-section${
                  formData.project_description.trim() ? " visible" : ""
                }`}
              >
                <button
                  type="submit"
                  className="generate-btn"
                  disabled={
                    !formData.project_description.trim() || isGenerating
                  }
                  tabIndex={formData.project_description.trim() ? 0 : -1}
                  aria-hidden={!formData.project_description.trim()}
                >
                  <span className="btn-text">
                    {isGenerating
                      ? "Generating..."
                      : hasValidApiKey()
                        ? "Generate Proposal"
                        : "Generate Prompt"}
                  </span>
                  <div className="btn-shine"></div>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="results-container">
            <div className="results-header">
              <h2>Results</h2>
              <div className="results-actions">
                {generatedProposal && (
                  <button
                    className="action-btn"
                    onClick={() => copyToClipboard(generatedProposal)}
                  >
                    Copy Proposal
                  </button>
                )}
                <button className="action-btn secondary" onClick={resetForm}>
                  Generate Another
                </button>
              </div>
            </div>

            <div className="results-content">
              {generatedProposal && (
                <div className="result-section">
                  <h3>Generated Proposal:</h3>
                  <div className="proposal-text">
                    <pre>{generatedProposal}</pre>
                  </div>
                </div>
              )}

              {generationError && (
                <div className="generation-error">
                  <p>{generationError}</p>
                </div>
              )}

              {!generatedProposal && !generationError && (
                <div className="no-api-message">
                  <p>
                    Add an API key to generate the proposal. You can still copy
                    the prompt and use it yourself.
                  </p>
                </div>
              )}

              {providersWithKeys.length > 0 && (
                <div className="retry-bar">
                  {providersWithKeys.length > 1 && (
                    <div
                      className="retry-providers"
                      role="radiogroup"
                      aria-label="AI provider"
                    >
                      {providersWithKeys.map((provider) => {
                        const selected =
                          formData.llm_provider === provider.id;
                        return (
                          <button
                            key={provider.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={`retry-provider${
                              selected ? " active" : ""
                            }`}
                            onClick={() => chooseProvider(provider)}
                          >
                            <ProviderLogo provider={provider.id} size={18} />
                            <span>{provider.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <label className="select-wrap retry-model-wrap">
                    <select
                      aria-label="AI model"
                      value={formData.llm_model}
                      onChange={(e) =>
                        handleInputChange("llm_model", e.target.value)
                      }
                    >
                      {getModels(
                        providerHasKey(formData.llm_provider)
                          ? formData.llm_provider
                          : providersWithKeys[0].id,
                      ).map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="select-chevron"
                      size={16}
                      aria-hidden="true"
                    />
                  </label>

                  <button
                    type="button"
                    className="retry-btn"
                    onClick={retryGeneration}
                    disabled={
                      isGenerating || !formData.project_description.trim()
                    }
                  >
                    <RefreshCw size={15} />
                    {isGenerating
                      ? "Generating..."
                      : generationError
                        ? "Retry"
                        : "Regenerate"}
                  </button>
                </div>
              )}

              <div className={`prompt-disclosure${promptOpen ? " open" : ""}`}>
                <div className="prompt-disclosure-header">
                  <button
                    type="button"
                    className="prompt-toggle"
                    aria-expanded={promptOpen}
                    onClick={() => setPromptOpen((open) => !open)}
                  >
                    <ChevronDown size={18} />
                    <span>Generated Prompt</span>
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => copyToClipboard(generatedPrompt)}
                  >
                    Copy Prompt
                  </button>
                </div>
                <div className="prompt-body">
                  <div className="prompt-body-inner">
                    <div className="prompt-text">
                      <pre>{generatedPrompt}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {keyModalProvider && (
        <div
          className={`key-modal-overlay${keyModalOpen ? " open" : ""}`}
          onClick={closeKeyForm}
        >
          <div
            className="key-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="key-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="key-modal-header">
              <div className="key-modal-heading">
                <ProviderLogo provider={keyModalProvider} size={22} />
                <h2 id="key-modal-title">
                  Add{" "}
                  {PROVIDERS.find((item) => item.id === keyModalProvider)?.name}{" "}
                  API key
                </h2>
              </div>
              <button
                type="button"
                className="key-close"
                onClick={closeKeyForm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <label htmlFor="provider-api-key">API key</label>
            <input
              id="provider-api-key"
              ref={keyInputRef}
              type="text"
              autoComplete="off"
              placeholder={
                keyModalProvider === "openai" ? "sk-..." : "sk-ant-..."
              }
              value={keyDraft}
              onInput={(e) => {
                setKeyDraft(e.target.value);
                if (keyError) setKeyError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveProviderKey();
                }
              }}
            />
            {keyError && <span className="error-message">{keyError}</span>}
            <div className="key-modal-footer">
              <a
                href={
                  PROVIDERS.find((item) => item.id === keyModalProvider)?.keyUrl
                }
                target="_blank"
                rel="noreferrer"
              >
                Get a{" "}
                {PROVIDERS.find((item) => item.id === keyModalProvider)?.name}{" "}
                key
              </a>
              <div className="key-modal-actions">
                <button
                  type="button"
                  className="key-cancel"
                  onClick={closeKeyForm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="key-save"
                  onClick={saveProviderKey}
                >
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

export default styled(GenerateProposal)`
  background: #ffffff;
  box-sizing: border-box;

  .container {
    position: relative;
    z-index: 1;
  }

  .section {
    margin-bottom: 28px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;

    &.providers-only {
      grid-template-columns: 1fr;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }

  .bid-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 4px 0 8px;
  }

  .select-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex: 1 1 150px;
    min-width: 150px;
    max-width: 220px;
    height: 40px;
    margin: 0;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    background: #ffffff;

    &:hover {
      border-color: #d0d5dd;
    }

    &:focus-within {
      border-color: #6296d3;
    }

    .select-icon {
      position: absolute;
      top: 50%;
      left: 11px;
      width: 16px;
      height: 16px;
      color: #6296d3;
      pointer-events: none;
      transform: translateY(-50%);
    }

    .select-chevron {
      position: absolute;
      top: 50%;
      right: 10px;
      width: 16px;
      height: 16px;
      color: #98a2b3;
      pointer-events: none;
      transform: translateY(-50%);
    }

    select {
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      height: 38px;
      min-height: 38px;
      margin: 0;
      padding: 0 34px 0 34px;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: #4b5563;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      line-height: 38px;
      cursor: pointer;

      &:hover,
      &:focus {
        border: none;
        background: transparent;
        transform: none;
        outline: none;
      }
    }
  }

  .bid-custom {
    width: auto;
    min-width: 132px;
    max-width: 180px;
    flex: 1 1 132px;
    height: 40px;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    background: #ffffff;
    color: #1c1c1c;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: text;

    &:hover,
    &:focus {
      border-color: #d0d5dd;
      background: #ffffff;
      transform: none;
    }
  }

  .form-group {
    margin-bottom: 30px;
  }

  label {
    display: block;
    margin-bottom: 12px;
    font-weight: 600;
    font-size: 1rem;
    line-height: 1.4;
    color: #333;

    .label-hint {
      display: block;
      font-weight: 400;
      font-size: 0.85rem;
      margin-top: 2px;
      color: #666;
    }
  }

  .input-wrapper {
    position: relative;

    .input-border {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(135deg, #6092c0 0%, #3f6da581 100%);
      transition: width 0.3s ease;
    }
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 16px 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
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
      border-color: #5486c090;
      background: rgba(0, 0, 0, 0.05);
      transform: translateY(-2px);
    }

    &:focus + .input-border {
      width: 100%;
    }

    &.error {
      border-color: rgba(255, 77, 79, 0.6);
      background: rgba(255, 77, 79, 0.05);
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

  .provider-choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .provider-choice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 54px;
    padding: 10px 12px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.02);
    color: #333;
    font: inherit;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;

    img {
      width: 18px;
      height: 18px;
      object-fit: contain;
    }

    &.active {
      border-color: #5486c0;
      background: rgba(84, 134, 192, 0.1);
    }

    &.locked {
      color: #98a2b3;
      background: rgba(0, 0, 0, 0.03);
      border-style: dashed;
      box-shadow: none;

      img {
        opacity: 0.4;
      }
    }

    .provider-copy {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.2;
    }

    .provider-hint {
      margin-top: 2px;
      color: #6296d3;
      font-size: 0.75rem;
      font-weight: 600;
    }
  }

  .key-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.48);
    opacity: 0;
    transition: opacity 0.2s ease;

    &.open {
      opacity: 1;

      .key-modal {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  }

  .key-modal {
    width: min(440px, 100%);
    padding: 24px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;

    label {
      margin-bottom: 8px;
    }

    .error-message {
      margin-top: 8px;
    }
  }

  .key-modal-header,
  .key-modal-heading,
  .key-modal-footer,
  .key-modal-actions {
    display: flex;
    align-items: center;
  }

  .key-modal-header {
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .key-modal-heading {
    gap: 10px;
    min-width: 0;

    h2 {
      margin: 0;
      color: #1c1c1c;
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.3;
    }

    img {
      width: 22px;
      height: 22px;
      flex-shrink: 0;
    }
  }

  .key-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #667085;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #1c1c1c;
    }
  }

  .key-modal-footer {
    justify-content: space-between;
    gap: 16px;
    margin-top: 20px;

    a {
      color: #3969a0;
      font-size: 0.9rem;
      font-weight: 600;
    }
  }

  .key-modal-actions {
    gap: 8px;
  }

  .key-cancel,
  .key-save {
    padding: 10px 16px;
    border-radius: 10px;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .key-cancel {
    border: 1px solid rgba(0, 0, 0, 0.12);
    background: #ffffff;
    color: #374151;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  .key-save {
    border: none;
    background: #6296d3;
    color: #ffffff;

    &:hover {
      background: #3969a0;
    }
  }

  .model-field {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 0 12px 0 16px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.02);
    box-sizing: border-box;

    &.error {
      border-color: rgba(255, 77, 79, 0.6);
      background: rgba(255, 77, 79, 0.05);
    }

    img {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      object-fit: contain;
    }

    select {
      appearance: none;
      -webkit-appearance: none;
      flex: 1;
      min-width: 0;
      width: auto;
      height: 50px;
      min-height: 50px;
      margin: 0;
      padding: 0 8px 0 0;
      border: none;
      background: transparent;
      color: #333;
      font-family: inherit;
      font-size: 15px;
      font-weight: 500;
      line-height: 50px;
      cursor: pointer;

      &:hover,
      &:focus {
        border: none;
        background: transparent;
        transform: none;
        outline: none;
      }
    }

    > svg {
      flex-shrink: 0;
      color: #98a2b3;
      pointer-events: none;
    }
  }

  textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.6;
  }

  #project_description {
    min-height: 120px;
    overflow: hidden;
    resize: none;
    transition:
      height 0.2s ease,
      border-color 0.3s ease,
      background 0.3s ease,
      transform 0.3s ease;
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ff6b6b;
    font-size: 13px;
    font-weight: 500;
    margin-top: 8px;

    &::before {
      content: "⚠️";
      font-size: 12px;
    }
  }

  .proposal-form {
    padding-bottom: 0;
    transition: padding-bottom 0.2s ease;
  }

  .proposal-form.has-submit {
    padding-bottom: 108px;
  }

  .submit-section {
    position: fixed;
    z-index: 40;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    margin: 0;
    padding: 16px 20px;
    background: #ffffff;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    opacity: 0;
    transform: translateY(100%);
    pointer-events: none;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
  }

  @media (min-width: 768px) {
    .submit-section {
      left: var(--sidebarWidth);
    }
  }

  .generate-btn {
    position: relative;
    background: linear-gradient(135deg, #6296d3 0%, #7bb1f1 100%);
    border: none;
    border-radius: 14px;
    height: 60px;
    font-size: 1.2rem;
    font-weight: 700;
    min-width: 250px;
    color: white;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    box-shadow:
      0 10px 30px rgba(93, 128, 102, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    overflow: hidden;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, #3969a0, transparent);
      transform: rotate(45deg);
      transition: all 0.6s ease;
      opacity: 0;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(45deg, #3c73bb, #5288ce, #549eff);
      transform: translateY(-3px);
      box-shadow:
        0 15px 40px rgba(93, 128, 102, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);

      .btn-shine {
        left: 100%;
        opacity: 1;
      }
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
    }

    .btn-text {
      font-weight: 700;
      letter-spacing: 0.5px;
    }
  }

  .results-container {
    margin-top: 20px;
  }

  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);

    h2 {
      margin: 0;
      color: #333;
    }

    .results-actions {
      display: flex;
      gap: 12px;
    }
  }

  .action-btn {
    padding: 12px 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.05);
    color: #333;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    &.secondary {
      background: #6296d3;
      color: white;
      border-color: #6296d3;

      &:hover {
        background: #3969a0;
        border-color: #3969a0;
      }
    }
  }

  .result-section {
    margin-bottom: 40px;

    h3 {
      color: #333;
      margin-bottom: 16px;
    }
  }

  .prompt-disclosure {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    background: #ffffff;
    overflow: hidden;
  }

  .prompt-disclosure-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
  }

  .prompt-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: #1c1c1c;
    font: inherit;
    font-size: 1.05rem;
    font-weight: 700;
    cursor: pointer;

    svg {
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }
  }

  .prompt-disclosure.open .prompt-toggle svg {
    transform: rotate(180deg);
  }

  .prompt-body {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.2s ease;
  }

  .prompt-disclosure.open .prompt-body {
    grid-template-rows: 1fr;
  }

  .prompt-body-inner {
    overflow: hidden;
  }

  .prompt-disclosure .prompt-text {
    margin: 0 16px 16px;
  }

  .prompt-disclosure:not(.open) .prompt-text {
    margin-bottom: 0;
  }

  .prompt-text,
  .proposal-text {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    padding: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
      font-family: inherit;
      line-height: 1.6;
      color: #333;
    }
  }

  .generation-error {
    text-align: center;
    padding: 20px 24px;
    margin-bottom: 24px;
    background: rgba(185, 28, 28, 0.08);
    border-radius: 12px;
    border: 1px solid rgba(185, 28, 28, 0.28);

    p {
      color: #b91c1c;
      margin: 0;
      font-weight: 600;
    }
  }

  .no-api-message {
    text-align: center;
    padding: 20px 24px;
    margin-bottom: 24px;
    background: rgba(251, 191, 36, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(251, 191, 36, 0.3);

    p {
      color: #d97706;
      margin: 0;
      font-weight: 600;
    }
  }

  .retry-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .retry-providers {
    display: flex;
    gap: 6px;
  }

  .retry-provider {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 10px;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    background: #ffffff;
    color: #4b5563;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;

    &.active {
      border-color: rgba(98, 150, 211, 0.55);
      background: rgba(98, 150, 211, 0.12);
      color: #3969a0;
    }
  }

  .retry-model-wrap {
    flex: 0 1 180px;
    min-width: 150px;
    max-width: 220px;
    height: 36px;

    select {
      height: 34px;
      min-height: 34px;
      padding: 0 32px 0 10px;
      color: #1c1c1c;
      font-size: 0.88rem;
      line-height: 34px;
    }

    .select-chevron {
      right: 8px;
    }
  }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 14px;
    border: none;
    border-radius: 10px;
    background: #6296d3;
    color: #ffffff;
    font-size: 0.88rem;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #3969a0;
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 24px 15px 32px;
    }

    .section {
      margin-bottom: 24px;
    }

    .generate-btn {
      min-width: 200px;
      font-size: 1.1rem;
      height: 55px;
    }

    .results-header {
      flex-direction: column;
      gap: 20px;
      align-items: flex-start;

      .results-actions {
        flex-wrap: wrap;
        width: 100%;
      }

      .action-btn {
        flex: 1;
        min-width: 120px;
      }
    }
  }
`;
