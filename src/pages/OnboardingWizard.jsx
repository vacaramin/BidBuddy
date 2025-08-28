import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  Button,
  Input,
  Select,
  Checkbox,
  Progress,
  Card,
  Typography,
  Space,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  KeyOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const OnboardingWizard = ({ onComplete, className }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
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
      {
        id: 3,
        provider: "google",
        name: "Google (Gemini)",
        apiKey: "",
        isValid: null,
      },
    ],
    promptSettings: {
      defaultTone: "professional",
      defaultUrgency: "normal",
      includePersonalInfo: true,
      customPromptPrefix: "",
      customPromptSuffix: "",
      maxWords: 500,
      includeCallToAction: true,
    },
  });

  const steps = [
    {
      title: "Welcome! Let's Get Started",
      icon: <UserOutlined />,
      description: "Tell us about yourself to personalize your proposals",
      component: "personal",
    },
    {
      title: "Connect Your AI",
      icon: <KeyOutlined />,
      description: "Add your API keys to power the proposal generation",
      component: "api",
    },
    {
      title: "Customize Your Style",
      icon: <SettingOutlined />,
      description: "Set your default preferences for proposal generation",
      component: "prompts",
    },
    {
      title: "You're All Set!",
      icon: <CheckCircleOutlined />,
      description: "Ready to generate amazing proposals",
      component: "complete",
    },
  ];

  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 0) {
      if (!formData.personalInfo.name.trim()) {
        newErrors.name = "Name is required";
      }
      if (!formData.personalInfo.email.trim()) {
        newErrors.email = "Email is required";
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email)
      ) {
        newErrors.email = "Please enter a valid email";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleComplete = () => {
    // Save to localStorage
    localStorage.setItem("proposalGeneratorSettings", JSON.stringify(formData));
    localStorage.setItem("hasCompletedOnboarding", "true");
    onComplete(formData);
  };

  const updateFormData = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...data },
    }));

    // Clear errors for updated fields
    if (errors) {
      const clearedErrors = { ...errors };
      Object.keys(data).forEach((key) => {
        delete clearedErrors[key];
      });
      setErrors(clearedErrors);
    }
  };

  const updateApiKey = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      apiKeys: prev.apiKeys.map((key) =>
        key.id === id ? { ...key, [field]: value } : key,
      ),
    }));
  };

  const renderPersonalInfo = () => (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon">
          <UserOutlined />
        </div>
        <Title level={2}>Tell us about yourself</Title>
        <Paragraph type="secondary">
          This information will be used to personalize your proposals and make
          them more professional.
        </Paragraph>
      </div>

      <div className="step-form">
        <Row gutter={24}>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">Full Name *</label>
              <Input
                size="large"
                placeholder="Enter your full name"
                value={formData.personalInfo.name}
                onChange={(e) =>
                  updateFormData("personalInfo", { name: e.target.value })
                }
                status={errors.name ? "error" : ""}
              />
              {errors.name && (
                <div className="error-message">{errors.name}</div>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">Email Address *</label>
              <Input
                size="large"
                type="email"
                placeholder="your@email.com"
                value={formData.personalInfo.email}
                onChange={(e) =>
                  updateFormData("personalInfo", { email: e.target.value })
                }
                status={errors.email ? "error" : ""}
              />
              {errors.email && (
                <div className="error-message">{errors.email}</div>
              )}
            </div>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">Phone Number (Optional)</label>
              <Input
                size="large"
                placeholder="+1 (555) 123-4567"
                value={formData.personalInfo.phone}
                onChange={(e) =>
                  updateFormData("personalInfo", { phone: e.target.value })
                }
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">Portfolio URL (Optional)</label>
              <Input
                size="large"
                placeholder="https://yourportfolio.com"
                value={formData.personalInfo.portfolioUrl}
                onChange={(e) =>
                  updateFormData("personalInfo", {
                    portfolioUrl: e.target.value,
                  })
                }
              />
            </div>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">GitHub URL (Optional)</label>
              <Input
                size="large"
                placeholder="https://github.com/yourusername"
                value={formData.personalInfo.githubUrl}
                onChange={(e) =>
                  updateFormData("personalInfo", { githubUrl: e.target.value })
                }
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">LinkedIn URL (Optional)</label>
              <Input
                size="large"
                placeholder="https://linkedin.com/in/yourusername"
                value={formData.personalInfo.linkedinUrl}
                onChange={(e) =>
                  updateFormData("personalInfo", {
                    linkedinUrl: e.target.value,
                  })
                }
              />
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );

  const renderApiKeys = () => (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon">
          <KeyOutlined />
        </div>
        <Title level={2}>Connect Your AI</Title>
        <Paragraph type="secondary">
          Add at least one API key to start generating proposals. Don't worry,
          you can add more later!
        </Paragraph>
      </div>

      <div className="step-form">
        <div className="api-keys-section">
          {formData.apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="api-key-card" size="small">
              <div className="api-key-header">
                <Title level={4}>{apiKey.name}</Title>
                <Text type="secondary">Optional</Text>
              </div>
              <div className="form-item">
                <Input.Password
                  size="large"
                  placeholder={`Enter your ${apiKey.name} API key`}
                  value={apiKey.apiKey}
                  onChange={(e) =>
                    updateApiKey(apiKey.id, "apiKey", e.target.value)
                  }
                />
              </div>
            </Card>
          ))}
        </div>

        <Card className="info-card">
          <div className="info-content">
            <Title level={5}>🔒 Your API keys are secure</Title>
            <Text type="secondary">
              API keys are stored locally in your browser and never transmitted
              to our servers. You can always update them later in settings.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderPromptSettings = () => (
    <div className="step-content">
      <div className="step-header">
        <div className="step-icon">
          <SettingOutlined />
        </div>
        <Title level={2}>Customize Your Style</Title>
        <Paragraph type="secondary">
          Set your default preferences for how proposals should be generated.
        </Paragraph>
      </div>

      <div className="step-form">
        <Row gutter={24}>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">Default Tone</label>
              <Select
                size="large"
                style={{ width: "100%" }}
                value={formData.promptSettings.defaultTone}
                onChange={(value) =>
                  updateFormData("promptSettings", { defaultTone: value })
                }
              >
                <Option value="professional">🎩 Professional</Option>
                <Option value="friendly">😊 Friendly</Option>
                <Option value="casual">👋 Casual</Option>
                <Option value="formal">📋 Formal</Option>
                <Option value="enthusiastic">🚀 Enthusiastic</Option>
              </Select>
            </div>
          </Col>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">Default Urgency</label>
              <Select
                size="large"
                style={{ width: "100%" }}
                value={formData.promptSettings.defaultUrgency}
                onChange={(value) =>
                  updateFormData("promptSettings", { defaultUrgency: value })
                }
              >
                <Option value="low">🐌 Low Priority</Option>
                <Option value="normal">⏰ Normal</Option>
                <Option value="high">🔥 High Priority</Option>
                <Option value="urgent">⚡ Urgent</Option>
              </Select>
            </div>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <div className="form-item">
              <label className="form-label">Maximum Words</label>
              <Input
                size="large"
                type="number"
                min={100}
                max={2000}
                value={formData.promptSettings.maxWords}
                onChange={(e) =>
                  updateFormData("promptSettings", {
                    maxWords: parseInt(e.target.value) || 500,
                  })
                }
              />
            </div>
          </Col>
          <Col span={12}>
            <div className="checkbox-section">
              <div className="checkbox-item">
                <Checkbox
                  checked={formData.promptSettings.includePersonalInfo}
                  onChange={(e) =>
                    updateFormData("promptSettings", {
                      includePersonalInfo: e.target.checked,
                    })
                  }
                >
                  Include personal info in proposals
                </Checkbox>
              </div>
              <div className="checkbox-item">
                <Checkbox
                  checked={formData.promptSettings.includeCallToAction}
                  onChange={(e) =>
                    updateFormData("promptSettings", {
                      includeCallToAction: e.target.checked,
                    })
                  }
                >
                  Include call-to-action
                </Checkbox>
              </div>
            </div>
          </Col>
        </Row>

        <div className="form-item">
          <label className="form-label">Custom Introduction (Optional)</label>
          <TextArea
            rows={3}
            placeholder="e.g., 'As an experienced developer with 5+ years in web development...'"
            value={formData.promptSettings.customPromptPrefix}
            onChange={(e) =>
              updateFormData("promptSettings", {
                customPromptPrefix: e.target.value,
              })
            }
          />
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="step-content complete-step">
      <div className="success-animation">
        <div className="checkmark-circle">
          <CheckCircleOutlined />
        </div>
      </div>

      <div className="step-header">
        <Title level={2}>🎉 You're all set!</Title>
        <Paragraph type="secondary" className="complete-text">
          Your account is now configured and ready to generate amazing
          proposals. You can always update these settings later from the
          settings page.
        </Paragraph>
      </div>

      <div className="summary-cards">
        <Card className="summary-card">
          <div className="summary-item">
            <UserOutlined className="summary-icon" />
            <div>
              <Text strong>Profile Setup</Text>
              <br />
              <Text type="secondary">Personal information configured</Text>
            </div>
          </div>
        </Card>

        <Card className="summary-card">
          <div className="summary-item">
            <KeyOutlined className="summary-icon" />
            <div>
              <Text strong>AI Integration</Text>
              <br />
              <Text type="secondary">
                {formData.apiKeys.filter((key) => key.apiKey).length} API key(s)
                added
              </Text>
            </div>
          </div>
        </Card>

        <Card className="summary-card">
          <div className="summary-item">
            <SettingOutlined className="summary-icon" />
            <div>
              <Text strong>Preferences</Text>
              <br />
              <Text type="secondary">Default settings configured</Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (steps[currentStep].component) {
      case "personal":
        return renderPersonalInfo();
      case "api":
        return renderApiKeys();
      case "prompts":
        return renderPromptSettings();
      case "complete":
        return renderComplete();
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="wizard-container">
        <div className="wizard-header">
          <div className="progress-section">
            <Progress
              percent={((currentStep + 1) / steps.length) * 100}
              showInfo={false}
              strokeColor={{
                "0%": "#667eea",
                "100%": "#764ba2",
              }}
            />
            <div className="step-indicator">
              <Text type="secondary">
                Step {currentStep + 1} of {steps.length}
              </Text>
            </div>
          </div>
        </div>

        <div className="wizard-content">{renderStepContent()}</div>

        <div className="wizard-footer">
          <div className="navigation-buttons">
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <Button
                size="large"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            )}

            <div className="spacer" />

            {currentStep < steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={handleNext}
                icon={<RightOutlined />}
                iconPosition="end"
              >
                {currentStep === 0 ? "Get Started" : "Continue"}
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={handleComplete}
                icon={<CheckCircleOutlined />}
              >
                Start Generating Proposals
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default styled(OnboardingWizard)`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;

  .wizard-container {
    width: 100%;
    max-width: 800px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .wizard-header {
    padding: 40px 40px 0;

    .progress-section {
      margin-bottom: 20px;

      .ant-progress {
        margin-bottom: 12px;

        .ant-progress-bg {
          height: 8px !important;
        }
      }

      .step-indicator {
        text-align: center;

        .ant-typography {
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
  }

  .wizard-content {
    padding: 20px 40px;
    min-height: 500px;
  }

  .step-content {
    .step-header {
      text-align: center;
      margin-bottom: 40px;

      .step-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
        color: white;
        font-size: 32px;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      }

      .ant-typography h2 {
        margin-bottom: 12px;
        color: #2c3e50;
        font-weight: 700;
      }

      .ant-typography p {
        font-size: 16px;
        color: #7f8c8d;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
      }
    }

    .step-form {
      .form-item {
        margin-bottom: 24px;

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2c3e50;
          font-size: 14px;
        }

        .error-message {
          color: #ff4d4f;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;

          &::before {
            content: "⚠️";
            font-size: 12px;
          }
        }
      }

      .ant-input,
      .ant-select-selector,
      .ant-input-password {
        border: 2px solid #e9ecef;
        transition: all 0.3s ease;

        &:hover {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        &:focus,
        &.ant-input-focused,
        &.ant-select-focused .ant-select-selector {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
        }

        &.ant-input-status-error,
        &.ant-input-status-error:hover,
        &.ant-input-status-error:focus {
          border-color: #ff4d4f;
          box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
        }
      }

      .ant-select-dropdown {
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      }
    }
  }

  .api-keys-section {
    .api-key-card {
      margin-bottom: 20px;
      border: 2px solid #f8f9fa;
      transition: all 0.3s ease;

      &:hover {
        border-color: #667eea;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
      }

      .api-key-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .ant-typography h4 {
          margin: 0;
          color: #2c3e50;
        }
      }
    }
  }

  .info-card {
    background: linear-gradient(135deg, #667eea15, #764ba215);
    border: 2px solid rgba(102, 126, 234, 0.2);
    margin-top: 24px;

    .info-content {
      .ant-typography h5 {
        margin-bottom: 8px;
        color: #667eea;
      }
    }
  }

  .checkbox-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 32px;

    .checkbox-item {
      .ant-checkbox-wrapper {
        font-weight: 500;
        color: #2c3e50;

        .ant-checkbox {
          .ant-checkbox-inner {
            border-width: 2px;

            &:hover {
              border-color: #667eea;
            }
          }

          &.ant-checkbox-checked .ant-checkbox-inner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
          }
        }
      }
    }
  }

  .complete-step {
    text-align: center;

    .success-animation {
      margin-bottom: 40px;

      .checkmark-circle {
        width: 120px;
        height: 120px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        color: white;
        font-size: 48px;
        animation: bounceIn 0.8s ease-out;
        box-shadow: 0 15px 40px rgba(16, 185, 129, 0.3);
      }
    }

    .complete-text {
      font-size: 18px;
      max-width: 500px;
      margin: 0 auto 40px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 40px;

      .summary-card {
        border: 2px solid #f8f9fa;

        .summary-item {
          display: flex;
          align-items: center;
          gap: 16px;

          .summary-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            flex-shrink: 0;
          }
        }
      }
    }
  }

  @keyframes bounceIn {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .wizard-footer {
    padding: 0 40px 40px;

    .navigation-buttons {
      display: flex;
      align-items: center;

      .spacer {
        flex: 1;
      }

      .ant-btn {
        height: 48px;
        padding: 0 24px;
        font-weight: 600;

        &.ant-btn-primary {
          border: none;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
          }
        }

        &:not(.ant-btn-primary) {
          border: 2px solid #e9ecef;
          color: #6c757d;

          &:hover {
            border-color: #667eea;
            color: #667eea;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding: 20px 15px;

    .wizard-container {
      max-width: 100%;
    }

    .wizard-header,
    .wizard-content,
    .wizard-footer {
      padding-left: 24px;
      padding-right: 24px;
    }

    .ant-row {
      .ant-col {
        margin-bottom: 0;
      }
    }

    .summary-cards {
      grid-template-columns: 1fr;
    }
  }
`;
