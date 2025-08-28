import { useState } from "preact/hooks";
import styled from "styled-components";

const GenerateProposal = ({ className }) => {
  const [formData, setFormData] = useState({
    project_description: "",
    llm_model: "gpt-4",
    llm_provider: "openai",
    conversation_type: "proper_proposal",
    tone: "professional",
    urgency: "normal",
    additional_notes: "",
  });

  const [errors, setErrors] = useState({});

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
    if (!formData.conversation_type) {
      newErrors.conversation_type = "Please select proposal type!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Success:", formData);
    }
  };

  return (
    <div className={className}>
      <h1>Generate Propsal</h1>
      <div className="container">
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
                      <option value="">Choose AI model for generation</option>
                      <option value="gpt-4">🚀 GPT-4 (Recommended)</option>
                      <option value="gpt-3.5-turbo">⚡ GPT-3.5 Turbo</option>
                      <option value="claude-3">🧠 Claude 3 Sonnet</option>
                      <option value="claude-2">📝 Claude 2</option>
                      <option value="gemini-pro">💎 Gemini Pro</option>
                      <option value="custom">🔧 Custom Model</option>
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
              <div className="section-header">
                <span className="section-icon">💡</span>
                <h2>Additional Details</h2>
              </div>

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

            <div className="submit-section">
              <button type="submit" className="generate-btn">
                <span className="btn-icon">🚀</span>
                <span className="btn-text">Generate Proposal</span>
                <div className="btn-shine"></div>
              </button>
            </div>
          </form>
        </div>
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

  .section {
    margin-bottom: 50px;

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 30px;

      .section-icon {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.05);
        backdrop-filter: blur(10px);
        border-radius: 12px;
      }

      h2 {
        color: #333;
        margin: 0;
        font-weight: 700;
        font-size: 1.4rem;
        letter-spacing: -0.5px;
      }
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
      background: linear-gradient(135deg, #5d8066 0%, #0d3b2c 100%);
      transition: width 0.3s ease;
    }
  }

  input,
  select,
  textarea {
    max-width: 100%;
    min-width: calc(100vw - 400px);
    padding: 16px 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
    color: #333;
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    font-family: inherit;

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
      border-color: #5d8066;
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
    background: linear-gradient(135deg, #5d8066 0%, #0d3b2c 100%);
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

    .btn-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      transform: rotate(45deg);
      transition: all 0.6s ease;
      opacity: 0;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow:
        0 15px 40px rgba(93, 128, 102, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);

      .btn-shine {
        left: 100%;
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(-1px);
    }

    .btn-icon {
      font-size: 1.3rem;
    }

    .btn-text {
      font-weight: 700;
      letter-spacing: 0.5px;
    }
  }

  @media (max-width: 768px) {
    textarea {
      min-width: calc(100% - 30px);
    }
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
  }
`;
