import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Input, Select, Checkbox, Card, Typography, Space, Row, Col, Tabs, message, Modal } from 'antd';
import { UserOutlined, KeyOutlined, SettingOutlined, SaveOutlined, ReloadOutlined, TestTubeOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

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

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};

const IntegratedSettings = ({ className }) => {
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

  // Use localStorage hook
  const [settings, setSettings] = useLocalStorage('proposalGeneratorSettings', defaultSettings);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('personal');
  const [testingApiKey, setTestingApiKey] = useState(null);

  // Handle input changes for personal info
  const handlePersonalInfoChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle API key changes
  const handleApiKeyChange = (id, value) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key => 
        key.id === id 
          ? { ...key, apiKey: value, isValid: null }
          : key
      )
    }));
  };

  // Handle prompt settings changes
  const handlePromptSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      promptSettings: {
        ...prev.promptSettings,
        [field]: value
      }
    }));
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

  // Test API key (mock function)
  const testApiKey = async (provider, apiKey) => {
    if (!apiKey.trim()) return false;
    
    // Mock API key validation - in real app, this would make actual API calls
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple validation based on key format
        let isValid = false;
        switch (provider) {
          case 'openai':
            isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
            break;
          case 'anthropic':
            isValid = apiKey.startsWith('sk-ant-') && apiKey.length > 30;
            break;
          case 'google':
            isValid = apiKey.length > 20;
            break;
          default:
            isValid = apiKey.length > 10;
        }
        resolve(isValid);
      }, 1500);
    });
  };

  // Handle API key testing
  const handleTestApiKey = async (id, provider, apiKey) => {
    if (!apiKey.trim()) {
      message.warning('Please enter an API key first');
      return;
    }

    setTestingApiKey(id);
    
    setSettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key => 
        key.id === id 
          ? { ...key, isValid: 'testing' }
          : key
      )
    }));

    try {
      const isValid = await testApiKey(provider, apiKey);
      
      setSettings(prev => ({
        ...prev,
        apiKeys: prev.apiKeys.map(key => 
          key.id === id 
            ? { ...key, isValid }
            : key
        )
      }));

      if (isValid) {
        message.success(`${provider.toUpperCase()} API key is valid!`);
      } else {
        message.error(`${provider.toUpperCase()} API key is invalid`);
      }
    } catch (error) {
      message.error('Error testing API key');
      setSettings(prev => ({
        ...prev,
        apiKeys: prev.apiKeys.map(key => 
          key.id === id 
            ? { ...key, isValid: false }
            : key
        )
      }));
    } finally {
      setTestingApiKey(null);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate personal info
    if (!settings.personalInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!settings.personalInfo.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(settings.personalInfo.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (settings.personalInfo.githubUrl && !isValidUrl(settings.personalInfo.githubUrl)) {
      newErrors.githubUrl = 'Please enter a valid GitHub URL';
    }
    
    if (settings.personalInfo.linkedinUrl && !isValidUrl(settings.personalInfo.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }
    
    if (settings.personalInfo.portfolioUrl && !isValidUrl(settings.personalInfo.portfolioUrl)) {
      newErrors.portfolioUrl = 'Please enter a valid portfolio URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      message.success('Settings saved successfully!');
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    Modal.confirm({
      title: 'Reset Settings',
      content: 'Are you sure you want to reset all settings to default? This action cannot be undone.',
      okText: 'Reset',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        setSettings(defaultSettings);
        setErrors({});
        message.success('Settings reset to defaults');
      },
    });
  };

  const renderPersonalInfo = () => (
    <div className="section">
      <div className="section-header">
        <div className="section-icon">
          <UserOutlined />
        </div>
        <div className="section-title">
          <Title level={3}>Personal Information</Title>
          <Paragraph type="secondary">
            This information will be used to personalize your proposals
          </Paragraph>
        </div>
      </div>
      
      <Row gutter={24}>
        <Col span={12}>
          <div className="form-item">
            <label className="form-label">Full Name *</label>
            <Input
              size="large"
              placeholder="Enter your full name"
              value={settings.personalInfo.name}
              onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
              status={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
        </Col>

        <Col span={12}>
          <div className="form-item">
            <label className="form-label">Email Address *</label>
            <Input
              size="large"
              type="email"
              placeholder="your@email.com"
              value={settings.personalInfo.email}
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
              status={errors.email ? 'error' : ''}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <div className="form-item">
            <label className="form-label">Phone Number</label>
            <Input
              size="large"
              placeholder="+1 (555) 123-4567"
              value={settings.personalInfo.phone}
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
            />
          </div>
        </Col>

        <Col span={12}>
          <div className="form-item">
            <label className="form-label">Portfolio URL</label>
            <Input
              size="large"
              placeholder="https://yourportfolio.com"
              value={settings.personalInfo.portfolioUrl}
              onChange={(e) => handlePersonalInfoChange('portfolioUrl', e.target.value)}
              status={errors.portfolioUrl ? 'error' : ''}
            />
            {errors.portfolioUrl && <div className="error-message">{errors.portfolioUrl}</div>}
          </div>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={12}>
          <div className="form-item">
            <label className="form-label">GitHub URL</label>
            <Input
              size="large"
              placeholder="https://github.com/yourusername"
              value={settings.personalInfo.githubUrl}
              onChange={(e) => handlePersonalInfoChange('githubUrl', e.target.value)}
              status={errors.githubUrl ? 'error' : ''}
            />
            {errors.githubUrl && <div className="error-message">{errors.githubUrl}</div>}
          </div>
        </Col>

        <Col span={12}>
          <div className="form-item">
            <label className="form-label">LinkedIn URL</label>
            <Input
              size="large"
              placeholder="https://linkedin.com/in/yourusername"
              value={settings.personalInfo.linkedinUrl}
              onChange={(e) => handlePersonalInfoChange('linkedinUrl', e.target.value)}
              status={errors.linkedinUrl ? 'error' : ''}
            />
            {errors.linkedinUrl && <div className="error-message">{errors.linkedinUrl}</div>}
          </div>
        </Col>
      </Row>
    </div>
  );

  const renderApiKeys = () => (
    <div className="section">
      <div className="section-header">
        <div className="section-icon">
          <KeyOutlined />
        </div>
        <div className="section-title">
          <Title level={3}>API Keys</Title>
          <Paragraph type="secondary">
            Configure your AI provider API keys. These are stored locally and never shared.
          </Paragraph>
        </div>
      </div>
      
      {settings.apiKeys.map((apiKey) => (
        <Card key={apiKey.id} className="api-key-card" size="small">
          <div className="api-key-header">
            <Title level={4}>{apiKey.name}</Title>
            {apiKey.isValid === true && <span className="status-badge success">✅ Valid</span>}
            {apiKey.isValid === false && <span className="status-badge error">❌ Invalid</span>}
            {apiKey.isValid === 'testing' && <span className="status-badge testing">🔄 Testing...</span>}
          </div>
          
          <div className="api-key-input-group">
            <div className="input-wrapper">
              <Input.Password
                size="large"
                placeholder={`Enter your ${apiKey.name} API key`}
                value={apiKey.apiKey}
                onChange={(e) => handleApiKeyChange(apiKey.id, e.target.value)}
              />
            </div>
            <Button
              size="large"
              icon={<TestTubeOutlined />}
              onClick={() => handleTestApiKey(apiKey.id, apiKey.provider, apiKey.apiKey)}
              disabled={!apiKey.apiKey.trim() || testingApiKey === apiKey.id}
              loading={testingApiKey === apiKey.id}
            >
              {testingApiKey === apiKey.id ? 'Testing...' : 'Test'}
            </Button>
          </div>
        </Card>
      ))}
      
      <Card className="info-card">
        <div className="info-content">
          <Title level={5}>🔒 Security Note</Title>
          <Text type="secondary">
            Your API keys are stored locally in your browser and are never transmitted to our servers. 
            Make sure to keep them secure and never share them publicly.
          </Text>
        </div>
      </Card>
    </div>
  );

  const renderPromptSettings = () => (
    <div className="section">
      <div className="section-header">
        <div className="section-icon">
          <SettingOutlined />
        </div>
        <div className="section-title">
          <Title level={3}>Prompt Settings</Title>
          <Paragraph type="secondary">
            Customize how your proposals are generated
          </Paragraph>
        </div>
      </div>
      
      <Row gutter={24}>
        <Col span={12}>
          <div className="form-item">
            <label className="form-label">Default Tone</label>
            <Select
              size="large"
              style={{ width: '100%' }}
              value={settings.promptSettings.defaultTone}
              onChange={(value) => handlePromptSettingChange('defaultTone', value)}
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
              style={{ width: '100%' }}
              value={settings.promptSettings.defaultUrgency}
              onChange={(value) => handlePromptSettingChange('defaultUrgency', value)}
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
              placeholder="500"
              value={settings.promptSettings.maxWords}
              onChange={(e) => handlePromptSettingChange('maxWords', parseInt(e.target.value) || 500)}
            />
          </div>
        </Col>

        <Col span={12}>
          <div className="checkbox-section">
            <div className="checkbox-item">
              <Checkbox
                checked={settings.promptSettings.includePersonalInfo}
                onChange={(e) => handlePromptSettingChange('includePersonalInfo', e.target.checked)}
              >
                Include Personal Info
              </Checkbox>
              <Text type="secondary" className="checkbox-hint">
                Automatically include your contact details in proposals
              </Text>
            </div>

            <div className="checkbox-item">
              <Checkbox
                checked={settings.promptSettings.includeCallToAction}
                onChange={(e) => handlePromptSettingChange('includeCallToAction', e.target.checked)}
              >
                Include Call to Action
              </Checkbox>
              <Text type="secondary" className="checkbox-hint">
                Add a compelling call-to-action at the end
              </Text>
            </div>
          </div>
        </Col>
      </Row>

      <div className="form-item">
        <label className="form-label">Custom Prompt Prefix</label>
        <TextArea
          rows={3}
          placeholder="e.g., 'As an experienced developer with 5+ years in web development...'"
          value={settings.promptSettings.customPromptPrefix}
          onChange={(e) => handlePromptSettingChange('customPromptPrefix', e.target.value)}
        />
        <Text type="secondary" className="field-hint">
          Text to add before the project description
        </Text>
      </div>

      <div className="form-item">
        <label className="form-label">Custom Prompt Suffix</label>
        <TextArea
          rows={3}
          placeholder="e.g., 'I'm available to start immediately and would love to discuss this project further.'"
          value={settings.promptSettings.customPromptSuffix}
          onChange={(e) => handlePromptSettingChange('customPromptSuffix', e.target.value)}
        />
        <Text type="secondary" className="field-hint">
          Text to add after the project description
        </Text>
      </div>
    </div>
  );

  return (
    <div className={className}>
      <div className="settings-container">
        <div className="settings-header">
          <div className="header-content">
            <div className="header-icon">
              <SettingOutlined />
            </div>
            <div className="header-text">
              <Title level={1}>Settings</Title>
              <Paragraph type="secondary">
                Configure your personal information, API keys, and default preferences
              </Paragraph>
            </div>
          </div>
        </div>

        <div className="settings-content">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            type="card"
            size="large"
            className="settings-tabs"
          >
            <TabPane 
              tab={
                <span>
                  <UserOutlined />
                  Personal Info
                </span>
              } 
              key="personal"
            >
              {renderPersonalInfo()}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <KeyOutlined />
                  API Keys
                </span>
              } 
              key="api"
            >
              {renderApiKeys()}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  Prompt Settings
                </span>
              } 
              key="prompts"
            >
              {renderPromptSettings()}
            </TabPane>
          </Tabs>
        </div>

        <div className="settings-footer">
          <div className="footer-actions">
            <Button 
              size="large"
              icon={<ReloadOutlined />}
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </Button>
            
            <Button 
              type="primary" 
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default styled(IntegratedSettings)`
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 24px;

  .settings-container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .settings-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px;
    color: white;
    
    .header-content {
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

  .settings-content {
    .settings-tabs {
      .ant-tabs-nav {
        margin: 0;
        padding: 0 40px;
        background: #f8f9fa;
        
        .ant-tabs-tab {
          background: transparent;
          border: none;
          border-radius: 0;
          margin: 0;
          padding: 20px 32px;
          color: #6c757d;
          font-weight: 600;
          transition: all 0.3s ease;
          
          &:hover {
            color: #667eea;
            background: rgba(102, 126, 234, 0.05);
          }
          
          &.ant-tabs-tab-active {
            background: white;
            color: #667eea;
            box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
            
            &::before {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, #667eea, #764ba2);
            }
          }
          
          .anticon {
            margin-right: 8px;
            font-size: 16px;
          }
        }
      }
      
      .ant-tabs-content-holder {
        background: white;
        
        .ant-tabs-content {
          padding: 40px;
        }
      }
    }
  }

  .section {
    margin-bottom: 48px;
    
    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 32px;
      
      .section-icon {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        flex-shrink: 0;
        margin-top: 8px;
      }
      
      .section-title {
        flex: 1;
        
        .ant-typography h3 {
          margin-bottom: 8px;
          color: #2c3e50;
          font-weight: 700;
        }
        
        .ant-typography p {
          color: #6c757d;
          margin: 0;
          font-size: 15px;
        }
      }
    }
  }

  .form-item {
    margin-bottom: 24px;
    
    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #2c3e50;
      font-size: 14px;
    }
    
    .field-hint {
      display: block;
      margin-top: 6px;
      font-size: 12px;
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

  .ant-input,
  .ant-select-selector,
  .ant-input-password {
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

  .api-key-card {
    margin-bottom: 24px;
    border-radius: 16px;
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
    
    .api-key-input-group {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      
      .input-wrapper {
        flex: 1;
      }
      
      .ant-btn {
        border-radius: 12px;
        border: 2px solid #e9ecef;
        font-weight: 600;
        
        &:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }
      }
    }
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    
    &.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    &.error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    &.testing {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
      animation: pulse 2s infinite;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .info-card {
    background: linear-gradient(135deg, #667eea15, #764ba215);
    border: 2px solid rgba(102, 126, 234, 0.2);
    border-radius: 16px;
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
    gap: 20px;
    padding-top: 24px;
    
    .checkbox-item {
      .ant-checkbox-wrapper {
        font-weight: 500;
        color: #2c3e50;
        margin-bottom: 4px;
        
        .ant-checkbox {
          .ant-checkbox-inner {
            border-radius: 6px;
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
      
      .checkbox-hint {
        display: block;
        margin-left: 24px;
        font-size: 12px;
      }
    }
  }

  .settings-footer {
    padding: 32px 40px;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
    
    .footer-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .ant-btn {
        border-radius: 12px;
        height: 48px;
        padding: 0 24px;
        font-weight: 600;
        
        &.ant-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    padding: 16px;
    
    .settings-header {
      padding: 24px;
      
      .header-content {
        flex-direction: column;
        text-align: center;
        gap: 16px;
        
        .header-icon {
          width: 60px;
          height: 60px;
          font-size: 24px;
        }
      }
    }
    
    .settings-tabs {
      .ant-tabs-nav {
        padding: 0 16px;
        
        .ant-tabs-tab {
          padding: 16px 20px;
          font-size: 14px;
        }
      }
      
      .ant-tabs-content {
        padding: 24px 16px;
      }
    }
    
    .section-header {
      flex-direction: column;
      text-align: center;
      gap: 16px;
      
      .section-icon {
        width: 40px;
        height: 40px;
        font-size: 16px;
        margin: 0 auto;
      }
    }
    
    .api-key-input-group {
      flex-direction: column;
      gap: 16px;
      
      .ant-btn {
        width: 100%;
      }
    }
    
    .settings-footer {
      padding: 24px 16px;
      
      .footer-actions {
        flex-direction: column;
        gap: 16px;
        
        .ant-btn {
          width: 100%;
        }
      }
    }
  }
`;