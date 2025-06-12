import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Input, Select, Card, Typography, Row, Col, message, Spin, Alert } from 'antd';
import { SendOutlined, SettingOutlined, UserOutlined, RobotOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Custom useLocalStorage hook
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

const IntegratedProposalGenerator = ({ className }) => {
  // Default settings structure
  const defaultSettings = {
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      githubUrl: '',
      linkedinUrl: '',
      portfolioUrl: ''
    },
    apiKeys: [
      { id: 1, provider: 'openai', name: 'OpenAI', apiKey: '', isValid: null },
      { id: 2, provider: 'anthropic', name: 'Anthropic (Claude)', apiKey: '', isValid: null },
      { id: 3, provider: 'google', name: 'Google (Gemini)', apiKey: '', isValid: null }
    ],
    promptSettings: {
      defaultTone: 'professional',
      defaultUrgency: 'normal',
      includePersonalInfo: true,
      customPromptPrefix: '',
      customPromptSuffix: '',
      maxWords: 500,
      includeCallToAction: true
    }
  };

  // Use localStorage hooks
  const [settings] = useLocalStorage('proposalGeneratorSettings', defaultSettings);
  const [generatedProposals, setGeneratedProposals] = useLocalStorage('generatedProposals', []);

  const [formData, setFormData] = useState({
    project_description: '',
    llm_model: '',
    llm_provider: '',
    conversation_type: 'proper_proposal',
    tone: settings.promptSettings.defaultTone,
    urgency: settings.promptSettings.defaultUrgency,
    additional_notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [availableModels, setAvailableModels] = useState([]);

  // Initialize available models based on API keys
  useEffect(() => {
    const models = [];
    settings.apiKeys.forEach(apiKey => {
      if (apiKey.apiKey && apiKey.isValid === true) {
        switch (apiKey.provider) {
          case 'openai':
            models.push(
              { value: 'gpt-4', label: '🚀 GPT-4 (Recommended)', provider: 'openai' },
              { value: 'gpt-3.5-turbo', label: '⚡ GPT-3.5 Turbo', provider: 'openai' }
            );
            break;
          case 'anthropic':
            models.push(
              { value: 'claude-3-sonnet', label: '🧠 Claude 3 Sonnet', provider: 'anthropic' },
              { value: 'claude-2', label: '📝 Claude 2', provider: 'anthropic' }
            );
            break;
          case 'google':
            models.push(
              { value: 'gemini-pro', label: '💎 Gemini Pro', provider: 'google' }
            );
            break;
        }
      }
    });
    
    setAvailableModels(models);
    
    // Set default model if none selected
    if (!formData.llm_model && models.length > 0) {
      const defaultModel = models.find(m => m.value === 'gpt-4') || models[0];
      setFormData(prev => ({
        ...prev,
        llm_model: defaultModel.value,
        llm_provider: defaultModel.provider
      }));
    }
  }, [settings.apiKeys]);

  // Update form defaults when settings change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      tone: settings.promptSettings.defaultTone,
      urgency: settings.promptSettings.defaultUrgency
    }));
  }, [settings.promptSettings]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Update provider when model changes
    if (name === 'llm_model') {
      const selectedModel = availableModels.find(m => m.value === value);
      if (selectedModel) {
        setFormData(prev => ({
          ...prev,
          llm_provider: selectedModel.provider
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.project_description.trim()) {
      newErrors.project_description = 'Please describe the project!';
    }
    if (!formData.llm_model) {
      newErrors.llm_model = 'Please select an AI model!';
    }
    if (!formData.conversation_type) {
      newErrors.conversation_type = 'Please select proposal type!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPrompt = () => {
    let prompt = '';
    
    // Add custom prefix if provided
    if (settings.promptSettings.customPromptPrefix) {
      prompt += settings.promptSettings.customPromptPrefix + '\n\n';
    }
    
    // Add personal info if enabled
    if (settings.promptSettings.includePersonalInfo && settings.personalInfo.name) {
      prompt += `My name is ${settings.personalInfo.name}`;
      if (settings.personalInfo.email) {
        prompt += ` and you can reach me at ${settings.personalInfo.email}`;
      }
      prompt += '. ';
    }
    
    // Add main content
    prompt += `Please write a ${formData.conversation_type.replace('_', ' ')} with a ${formData.tone} tone `;
    prompt += `for the following project:\n\n${formData.project_description}`;
    
    // Add additional notes if provided
    if (formData.additional_notes.trim()) {
      prompt += `\n\nAdditional requirements: ${formData.additional_notes}`;
    }
    
    // Add word limit
    prompt += `\n\nPlease keep the response under ${settings.promptSettings.maxWords} words.`;
    
    // Add urgency context
    if (formData.urgency !== 'normal') {
      const urgencyText = {
        'low': 'This is a low-priority project with flexible timelines.',
        'high': 'This is a high-priority project that needs prompt attention.',
        'urgent': 'This is an urgent project requiring immediate action.'
      };
      prompt += ` ${urgencyText[formData.urgency]}`;
    }
    
    // Add call to action if enabled
    if (settings.promptSettings.includeCallToAction) {
      prompt += ' Please include a compelling call-to-action at the end.';
    }
    
    // Add custom suffix if provided
    if (settings.promptSettings.customPromptSuffix) {
      prompt += '\n\n' + settings.promptSettings.customPromptSuffix;
    }
    
    return prompt;
  };

  const mockApiCall = async (prompt, model, provider) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Mock response based on conversation type and tone
    const responses = {
      'proper_proposal': `Dear Hiring Manager,

I hope this message finds you well. I am writing to express my strong interest in the project you've outlined, and I believe my skills and experience make me an ideal candidate for this opportunity.

**Project Understanding:**
Based on your description, I understand that you need ${formData.project_description.slice(0, 100)}... This aligns perfectly with my expertise and previous work experience.

**My Approach:**
I propose to tackle this project with a systematic approach:
1. Initial analysis and requirement gathering
2. Planning and architecture design
3. Implementation with regular progress updates
4. Testing and quality assurance
5. Deployment and documentation

**Why Choose Me:**
- Proven track record in similar projects
- Strong communication and project management skills
- Commitment to quality and timely delivery
- Competitive pricing with flexible payment terms

**Next Steps:**
I would love to discuss this project further and answer any questions you might have. I'm available for a call at your convenience and can start immediately.

Looking forward to the opportunity to work together and bring your vision to life.

Best regards,
${settings.personalInfo.name || 'Your Name'}
${settings.personalInfo.email || 'your.email@example.com'}`,

      'conversational': `Hi there! 👋

Thanks for sharing this project - it looks really interesting! I've been working on similar projects and I think I could be a great fit.

From what I understand, you're looking for ${formData.project_description.slice(0, 100)}... This is right up my alley! I've done quite a bit of work in this area and have some ideas on how to approach it.

Here's what I'm thinking:
• We could start with a quick discovery call to nail down the requirements
• I'd put together a detailed plan with timelines and milestones  
• Keep you updated throughout the process with regular check-ins
• Make sure everything is tested and polished before delivery

I'm pretty flexible with my schedule and could potentially start this week. Would love to chat more about your vision for this project!

Feel free to reach out if you have any questions - always happy to discuss projects like this.

Cheers!
${settings.personalInfo.name || 'Your Name'}`,

      'message_reply': `Thanks for reaching out about this project!

I'm definitely interested and think I can help you achieve what you're looking for. Based on your description, this seems like a perfect match for my skills.

Quick question - do you have a specific timeline in mind? I'm available to start right away and typically deliver projects like this within [timeframe].

I'd be happy to jump on a quick call to discuss the details further. When works best for you?

Best,
${settings.personalInfo.name || 'Your Name'}`,

      'follow_up': `Hi again!

I wanted to follow up on the project we discussed earlier. I've been thinking about your requirements and I'm even more excited about the possibility of working together.

I've put together some initial thoughts on how we could approach this:
- [Key approach point 1]
- [Key approach point 2]  
- [Key approach point 3]

I'm still very interested and available to start as soon as you're ready. Please let me know if you'd like to move forward or if you have any additional questions.

Looking forward to hearing from you!

${settings.personalInfo.name || 'Your Name'}`,

      'cold_outreach': `Subject: Partnership Opportunity - ${formData.project_description.slice(0, 50)}...

Hello!

I hope you don't mind me reaching out directly. I came across your project posting and was immediately interested in what you're building.

I specialize in exactly this type of work and have successfully delivered similar projects for clients in the past. What caught my attention was [specific detail from project description].

I'd love to offer my services and discuss how I can help bring your vision to life. I believe I can add significant value to this project with my experience in [relevant skills/technologies].

Would you be open to a brief conversation about your project? I'm confident I can provide a solution that exceeds your expectations.

Best regards,
${settings.personalInfo.name || 'Your Name'}
${settings.personalInfo.email || 'your.email@example.com'}`,

      'bid_response': `**Proposal for: ${formData.project_description.slice(0, 100)}...**

Thank you for the opportunity to submit a proposal for your project. After carefully reviewing your requirements, I'm confident I can deliver exactly what you're looking for.

**Project Summary:**
[Brief restatement of project goals and requirements]

**Proposed Solution:**
I will deliver a comprehensive solution that includes:
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

**Timeline & Milestones:**
- Week 1: Initial setup and planning
- Week 2-3: Core development
- Week 4: Testing and refinement
- Week 5: Final delivery and handover

**Investment:**
$[Amount] - This includes all development, testing, and documentation.

**Why I'm the Right Choice:**
- [Years] of experience in this field
- Proven track record with similar projects
- Strong communication and reliability
- Post-delivery support included

I'm ready to start immediately and guarantee your satisfaction with the final product.

Best regards,
${settings.personalInfo.name || 'Your Name'}`
    };

    return responses[formData.conversation_type] || responses['proper_proposal'];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check if user has valid API keys
    const hasValidApiKey = settings.apiKeys.some(key => key.apiKey && key.isValid === true);
    if (!hasValidApiKey) {
      message.error('No valid API keys found. Please configure your API keys in settings first.');
      return;
    }

    setIsGenerating(true);
    setGeneratedProposal('');

    try {
      const prompt = buildPrompt();
      const proposal = await mockApiCall(prompt, formData.llm_model, formData.llm_provider);
      
      setGeneratedProposal(proposal);
      
      // Save to history
      const newProposal = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        projectDescription: formData.project_description.slice(0, 100) + '...',
        model: formData.llm_model,
        provider: formData.llm_provider,
        type: formData.conversation_type,
        tone: formData.tone,
        proposal: proposal
      };
      
      setGeneratedProposals(prev => [newProposal, ...prev.slice(0, 49)]); // Keep last 50
      
      message.success('Proposal generated successfully!');
    } catch (error) {
      message.error('Failed to generate proposal. Please try again.');
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedProposal);
    message.success('Proposal copied to clipboard!');
  };

  const hasValidApiKeys = settings.apiKeys.some(key => key.apiKey && key.isValid === true);

  return (
    <div className={className}>
      <div className="container">
        <div className="header">
          <div className="header-content">
            <div className="header-icon">
              <FileTextOutlined />
            </div>
            <div className="header-text">
              <Title level={1}>Generate Proposal</Title>
              <Paragraph type="secondary">
                Create professional proposals using AI with your personalized settings
              </Paragraph>
            </div>
          </div>
        </div>

        {!hasValidApiKeys && (
          <Alert
            message="No Valid API Keys Found"
            description="You need to configure at least one valid API key in settings to generate proposals."
            type="warning"
            showIcon
            action={
              <Button size="small" icon={<SettingOutlined />}>
                Go to Settings
              </Button>
            }
            className="api-warning"
          />
        )}

        <div className="content">
          <Row gutter={32}>
            <Col xs={24} lg={12}>
              <Card className="form-card" title="Project Details">
                <form onSubmit={handleSubmit} className="proposal-form">
                  <div className="form-section">
                    <div className="form-item">
                      <label className="form-label">
                        Project Description *
                        <span className="label-hint">Paste the project posting here</span>
                      </label>
                      <TextArea
                        rows={4}
                        placeholder="Paste the project description from the job posting or describe your project in detail..."
                        value={formData.project_description}
                        onChange={(e) => handleInputChange('project_description', e.target.value)}
                        status={errors.project_description ? 'error' : ''}
                      />
                      {errors.project_description && (
                        <div className="error-message">{errors.project_description}</div>
                      )}
                    </div>

                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="form-item">
                          <label className="form-label">
                            AI Model *
                            <span className="label-hint">Choose your AI assistant</span>
                          </label>
                          <Select
                            size="large"
                            style={{ width: '100%' }}
                            placeholder="Choose AI model for generation"
                            value={formData.llm_model}
                            onChange={(value) => handleInputChange('llm_model', value)}
                            status={errors.llm_model ? 'error' : ''}
                            disabled={availableModels.length === 0}
                          >
                            {availableModels.map(model => (
                              <Option key={model.value} value={model.value}>
                                {model.label}
                              </Option>
                            ))}
                          </Select>
                          {errors.llm_model && (
                            <div className="error-message">{errors.llm_model}</div>
                          )}
                        </div>
                      </Col>

                      <Col span={12}>
                        <div className="form-item">
                          <label className="form-label">
                            Proposal Type *
                            <span className="label-hint">What style do you need?</span>
                          </label>
                          <Select
                            size="large"
                            style={{ width: '100%' }}
                            placeholder="What kind of response do you need?"
                            value={formData.conversation_type}
                            onChange={(value) => handleInputChange('conversation_type', value)}
                            status={errors.conversation_type ? 'error' : ''}
                          >
                            <Option value="proper_proposal">📄 Formal Proposal</Option>
                            <Option value="conversational">💬 Conversational Message</Option>
                            <Option value="message_reply">⚡ Quick Reply</Option>
                            <Option value="follow_up">🔄 Follow-up Message</Option>
                            <Option value="cold_outreach">🎯 Cold Outreach</Option>
                            <Option value="bid_response">🏆 Competitive Bid</Option>
                          </Select>
                          {errors.conversation_type && (
                            <div className="error-message">{errors.conversation_type}</div>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="form-item">
                          <label className="form-label">Tone</label>
                          <Select
                            size="large"
                            style={{ width: '100%' }}
                            value={formData.tone}
                            onChange={(value) => handleInputChange('tone', value)}
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
                          <label className="form-label">Urgency</label>
                          <Select
                            size="large"
                            style={{ width: '100%' }}
                            value={formData.urgency}
                            onChange={(value) => handleInputChange('urgency', value)}
                          >
                            <Option value="low">🐌 Low Priority</Option>
                            <Option value="normal">⏰ Normal</Option>
                            <Option value="high">🔥 High Priority</Option>
                            <Option value="urgent">⚡ Urgent</Option>
                          </Select>
                        </div>
                      </Col>
                    </Row>

                    <div className="form-item">
                      <label className="form-label">
                        Additional Notes
                        <span className="label-hint">Any specific requirements or context</span>
                      </label>
                      <TextArea
                        rows={3}
                        placeholder="Share any specific requirements, deadlines, budget constraints, or special points you want to highlight..."
                        value={formData.additional_notes}
                        onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="submit-section">
                    <Button 
                      type="primary" 
                      size="large"
                      htmlType="submit"
                      icon={<SendOutlined />}
                      loading={isGenerating}
                      disabled={!hasValidApiKeys}
                      className="generate-btn"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Proposal'}
                    </Button>
                  </div>
                </form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card 
                className="result-card" 
                title="Generated Proposal"
                extra={
                  generatedProposal && (
                    <Button 
                      size="small" 
                      onClick={copyToClipboard}
                      icon={<RobotOutlined />}
                    >
                      Copy
                    </Button>
                  )
                }
              >
                {isGenerating ? (
                  <div className="loading-container">
                    <Spin size="large" />
                    <Text type="secondary" className="loading-text">
                      Generating your proposal...
                    </Text>
                  </div>
                ) : generatedProposal ? (
                  <div className="proposal-content">
                    <pre className="proposal-text">{generatedProposal}</pre>
                  </div>
                ) : (
                  <div className="empty-state">
                    <RobotOutlined className="empty-icon" />
                    <Text type="secondary">
                      Your generated proposal will appear here
                    </Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
};

export default styled(IntegratedProposalGenerator)`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    background: white;
    border-radius: 24px 24px 0 0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-bottom: 24px;
    
    .header-content {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px;
      color: white;
      display: flex;
      align-items: center;
      gap: 24px;
      
      .header-icon {
        width: 80px;
        height: 80px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        backdrop-filter: blur(10px);
      }
      
      .header-text {
        .ant-typography h1 {
          color: white;
          margin-bottom: 8px;
          font-weight: 700;
        }
        
        .ant-typography p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin: 0;
        }
      }
    }
  }

  .api-warning {
    margin-bottom: 24px;
    border-radius: 12px;
  }

  .content {
    .ant-row {
      .ant-col {
        margin-bottom: 24px;
      }
    }
  }

  .form-card,
  .result-card {
    border-radius: 16px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    height: fit-content;
    
    .ant-card-head {
      border-bottom: 2px solid #f0f0f0;
      
      .ant-card-head-title {
        font-weight: 700;
        color: #2c3e50;
        font-size: 18px;
      }
    }
    
    .ant-card-body {
      padding: 32px;
    }
  }

  .result-card {
    position: sticky;
    top: 24px;
  }

  .form-section {
    .form-item {
      margin-bottom: 24px;
      
      .form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #2c3e50;
        font-size: 14px;
        
        .label-hint {
          display: block;
          font-weight: 400;
          font-size: 12px;
          color: #6c757d;
          margin-top: 2px;
        }
      }
      
      .error-message {
        color: #ff4d4f;
        font-size: 12px;
        margin-top: 4px;
        display: flex;
        align-items: center;
        gap: 4px;
        
        &::before {
          content: '⚠️';
          font-size: 12px;
        }
      }
    }
  }

  .ant-input,
  .ant-select-selector {
    border-radius: 12px;
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
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  }

  .submit-section {
    text-align: center;
    margin-top: 32px;
    
    .generate-btn {
      height: 56px;
      padding: 0 32px;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.4);
      }
      
      &:disabled {
        background: #d9d9d9;
        box-shadow: none;
        transform: none;
      }
    }
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
    
    .loading-text {
      font-size: 16px;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
    
    .empty-icon {
      font-size: 48px;
      color: #d9d9d9;
    }
    
    .ant-typography {
      font-size: 16px;
    }
  }

  .proposal-content {
    .proposal-text {
      white-space: pre-wrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #2c3e50;
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
      border: 2px solid #e9ecef;
      margin: 0;
      max-height: 600px;
      overflow-y: auto;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;
    
    .header {
      margin-bottom: 16px;
      
      .header-content {
        padding: 24px;
        flex-direction: column;
        text-align: center;
        gap: 16px;
        
        .header-icon {
          width: 60px;
          height: 60px;
          font-size: 24px;
        }
        
        .header-text {
          .ant-typography h1 {
            font-size: 24px;
          }
          
          .ant-typography p {
            font-size: 14px;
          }
        }
      }
    }
    
    .form-card,
    .result-card {
      .ant-card-body {
        padding: 20px;
      }
    }
    
    .result-card {
      position: static;
      margin-top: 16px;
    }
    
    .proposal-content {
      .proposal-text {
        font-size: 13px;
        padding: 16px;
        max-height: 400px;
      }
    }
  }
`;