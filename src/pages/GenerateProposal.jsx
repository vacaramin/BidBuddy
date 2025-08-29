import { useState, useEffect } from "preact/hooks";
import styled from "styled-components";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";
import { ApiService } from "../utils/apiService";

const GenerateProposal = ({ className }) => {
  const [formData, setFormData] = useState({
    project_description: "",
    llm_model: "gpt-4",
    llm_provider: "openai",
    additional_notes: "",
  });

  const [settings, setSettings] = useState(null);
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Load settings on component mount
    const savedSettings = getFromStorage(STORAGE_KEYS.SETTINGS);
    setSettings(savedSettings);
  }, []);

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    let prompt = `${promptSettings.customPromptPrefix || ""}  

I need you to write a compelling project proposal based on the following project description:

"${formData.project_description}"

${formData.additional_notes ? `Additional context: ${formData.additional_notes}` : ""}

Please create a proposal that includes my personal details and is approximately ${promptSettings.maxWords || 500} words
${personalInfo.name ? `My name is ${personalInfo.name}.` : ""}
${personalInfo.portfolioUrl ? `Portfolio: ${personalInfo.portfolioUrl}` : ""}
${personalInfo.githubUrl ? `GitHub: ${personalInfo.githubUrl}` : ""}
${personalInfo.linkedinUrl ? `LinkedIn: ${personalInfo.linkedinUrl}` : ""}

${promptSettings.customPromptSuffix || ""}`;

    return prompt;
  };

  const getApiKey = () => {
    if (!settings?.apiKeys) return null;

    const apiKeyObj = settings.apiKeys.find(
      (key) => key.provider === formData.llm_provider && key.isValid === true,
    );

    return apiKeyObj?.apiKey || null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const prompt = buildPrompt();
    setGeneratedPrompt(prompt);

    const apiKey = getApiKey();

    if (!apiKey) {
      // No API key available, just show the prompt
      setGeneratedProposal("");
      setShowResults(true);
      return;
    }

    setIsGenerating(true);
    setShowResults(false);

    try {
      let response;
      const messages = [{ role: "user", content: prompt }];

      if (formData.llm_provider === "openai") {
        response = await ApiService.callOpenAI(
          apiKey,
          messages,
          formData.llm_model,
        );
        setGeneratedProposal(
          response.choices[0]?.message?.content || "No response generated",
        );
      } else if (formData.llm_provider === "anthropic") {
        // Convert messages format for Claude
        const claudeMessages = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        response = await ApiService.callClaude(apiKey, claudeMessages);
        setGeneratedProposal(
          response.content[0]?.text || "No response generated",
        );
      }

      // Save to history
      const proposal = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        project_description: formData.project_description,
        additional_notes: formData.additional_notes,
        llm_provider: formData.llm_provider,
        llm_model: formData.llm_model,
        prompt_used: prompt,
        generated_proposal: generatedProposal,
      };

      const existingProposals = getFromStorage(STORAGE_KEYS.PROPOSALS, []);
      saveToStorage(STORAGE_KEYS.PROPOSALS, [proposal, ...existingProposals]);
    } catch (error) {
      console.error("Error generating proposal:", error);
      setGeneratedProposal(`Error generating proposal: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setShowResults(true);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const resetForm = () => {
    setFormData({
      project_description: "",
      llm_model: "gpt-4",
      llm_provider: "openai",
      additional_notes: "",
    });
    setGeneratedProposal("");
    setGeneratedPrompt("");
    setShowResults(false);
    setErrors({});
  };

  const hasValidApiKey = () => {
    return getApiKey() !== null;
  };

  return (
    <div className={className}>
      <h1>Generate Proposal</h1>
      <div className="container">
        {!showResults ? (
          <div className="proposal-card">
            <form onSubmit={handleSubmit}>
              <div className="section">
                <div className="form-group">
                  <label htmlFor="project_description">
                    Project Description *
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="project_description"
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

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="llm_provider">AI Provider *</label>
                    <div className="input-wrapper">
                      <select
                        id="llm_provider"
                        value={formData.llm_provider}
                        onChange={(e) => {
                          handleInputChange("llm_provider", e.target.value);
                          // Reset model when provider changes
                          if (e.target.value === "openai") {
                            handleInputChange("llm_model", "gpt-4");
                          } else if (e.target.value === "anthropic") {
                            handleInputChange("llm_model", "claude-3-sonnet");
                          }
                        }}
                      >
                        <option value="openai">🤖 OpenAI</option>
                        <option value="anthropic">🧠 Anthropic (Claude)</option>
                      </select>
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="llm_model">AI Model *</label>
                    <div className="input-wrapper">
                      <select
                        id="llm_model"
                        value={formData.llm_model}
                        onChange={(e) =>
                          handleInputChange("llm_model", e.target.value)
                        }
                        className={errors.llm_model ? "error" : ""}
                      >
                        {formData.llm_provider === "openai" ? (
                          <>
                            <option value="gpt-4">
                              🚀 GPT-4 (Recommended)
                            </option>
                            <option value="gpt-3.5-turbo">
                              ⚡ GPT-3.5 Turbo
                            </option>
                          </>
                        ) : (
                          <>
                            <option value="claude-3-sonnet">
                              🧠 Claude 3 Sonnet
                            </option>
                            <option value="claude-3-haiku">
                              📝 Claude 3 Haiku
                            </option>
                          </>
                        )}
                      </select>
                      <div className="input-border"></div>
                    </div>
                    {errors.llm_model && (
                      <span className="error-message">{errors.llm_model}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="form-group">
                  <label htmlFor="additional_notes">
                    Additional Notes
                    <span className="label-hint">
                      Any specific requirements or context
                    </span>
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="additional_notes"
                      rows={3}
                      placeholder="Share any specific requirements, deadlines, budget constraints, or special points you want to highlight..."
                      value={formData.additional_notes}
                      onChange={(e) =>
                        handleInputChange("additional_notes", e.target.value)
                      }
                    />
                    <div className="input-border"></div>
                  </div>
                </div>
              </div>

              {!hasValidApiKey() && (
                <div className="warning-message">
                  ⚠️ No valid API key found for {formData.llm_provider}. You'll
                  get the prompt to use manually.
                </div>
              )}

              <div className="submit-section">
                <button
                  type="submit"
                  className="generate-btn"
                  disabled={isGenerating}
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
                <button
                  className="action-btn"
                  onClick={() => copyToClipboard(generatedPrompt)}
                >
                  Copy Prompt
                </button>
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
              <div className="result-section">
                <h3>Generated Prompt:</h3>
                <div className="prompt-text">
                  <pre>{generatedPrompt}</pre>
                </div>
              </div>

              {generatedProposal && (
                <div className="result-section">
                  <h3>Generated Proposal:</h3>
                  <div className="proposal-text">
                    <pre>{generatedProposal}</pre>
                  </div>
                </div>
              )}

              {!generatedProposal && (
                <div className="no-api-message">
                  <h3>No API Key Available</h3>
                  <p>
                    Copy the prompt above and use it with your preferred AI
                    service to generate the proposal.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default styled(GenerateProposal)`
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
  background: #ffffff;

  .container {
    position: relative;
    z-index: 1;
    padding: 0px 20px;
  }

  .warning-message {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid rgba(251, 191, 36, 0.3);
    border-radius: 12px;
    padding: 16px 20px;
    margin-bottom: 30px;
    color: #d97706;
    font-weight: 600;
  }

  .section {
    margin-bottom: 50px;
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

  textarea {
    resize: vertical;
    min-height: 120px;
    line-height: 1.6;
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

  .submit-section {
    text-align: center;
    margin-top: 60px;
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

  .no-api-message {
    text-align: center;
    padding: 40px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 12px;
    border: 2px solid rgba(59, 130, 246, 0.2);

    h3 {
      color: #3b82f6;
      margin-bottom: 12px;
    }

    p {
      color: #1e40af;
      margin: 0;
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 20px 15px;
    }

    .section {
      margin-bottom: 40px;
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
