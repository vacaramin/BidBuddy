import { useState, useEffect } from 'preact/hooks';
import styled from 'styled-components';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const Settings = ({ className }) => {
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
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

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
      }, 1000);
    });
  };

  // Handle API key testing
  const handleTestApiKey = async (id, provider, apiKey) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key => 
        key.id === id 
          ? { ...key, isValid: 'testing' }
          : key
      )
    }));

    const isValid = await testApiKey(provider, apiKey);
    
    setSettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.map(key => 
        key.id === id 
          ? { ...key, isValid }
          : key
      )
    }));
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
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      setSettings(defaultSettings);
      setErrors({});
      setSuccessMessage('Settings reset to defaults');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  return (
    <div className={className}>
      <div className="container">
        <div className="settings-card">
          <div className="card-header">
            <div className="icon-wrapper">
              <span className="icon">⚙️</span>
            </div>
          </div>

          {successMessage && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {successMessage}
            </div>
          )}

          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <span className="tab-icon">👤</span>
              Personal Info
            </button>
            <button 
              className={`tab ${activeTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveTab('api')}
            >
              <span className="tab-icon">🔑</span>
              API Keys
            </button>
            <button 
              className={`tab ${activeTab === 'prompts' ? 'active' : ''}`}
              onClick={() => setActiveTab('prompts')}
            >
              <span className="tab-icon">💬</span>
              Prompt Settings
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'personal' && (
              <div className="section">
                <div className="section-header">
                  <span className="section-icon">👤</span>
                  <h2>Personal Information</h2>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">
                      Full Name *
                      <span className="label-hint">Your professional name</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={settings.personalInfo.name}
                        onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                        className={errors.name ? 'error' : ''}
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.name && <span className="error-message">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      Email Address *
                      <span className="label-hint">Your professional email</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={settings.personalInfo.email}
                        onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                        className={errors.email ? 'error' : ''}
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">
                      Phone Number
                      <span className="label-hint">Optional contact number</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={settings.personalInfo.phone}
                        onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                      />
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="portfolioUrl">
                      Portfolio URL
                      <span className="label-hint">Your portfolio website</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="portfolioUrl"
                        type="url"
                        placeholder="https://yourportfolio.com"
                        value={settings.personalInfo.portfolioUrl}
                        onChange={(e) => handlePersonalInfoChange('portfolioUrl', e.target.value)}
                        className={errors.portfolioUrl ? 'error' : ''}
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.portfolioUrl && <span className="error-message">{errors.portfolioUrl}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="githubUrl">
                      GitHub URL
                      <span className="label-hint">Your GitHub profile</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="githubUrl"
                        type="url"
                        placeholder="https://github.com/yourusername"
                        value={settings.personalInfo.githubUrl}
                        onChange={(e) => handlePersonalInfoChange('githubUrl', e.target.value)}
                        className={errors.githubUrl ? 'error' : ''}
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.githubUrl && <span className="error-message">{errors.githubUrl}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="linkedinUrl">
                      LinkedIn URL
                      <span className="label-hint">Your LinkedIn profile</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/yourusername"
                        value={settings.personalInfo.linkedinUrl}
                        onChange={(e) => handlePersonalInfoChange('linkedinUrl', e.target.value)}
                        className={errors.linkedinUrl ? 'error' : ''}
                      />
                      <div className="input-border"></div>
                    </div>
                    {errors.linkedinUrl && <span className="error-message">{errors.linkedinUrl}</span>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="section">
                <div className="section-header">
                  <span className="section-icon">🔑</span>
                  <h2>API Keys</h2>
                  <p className="section-description">Configure your AI provider API keys. These are stored locally and never shared.</p>
                </div>
                
                {settings.apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="api-key-group">
                    <div className="api-key-header">
                      <h3>{apiKey.name}</h3>
                      {apiKey.isValid === true && <span className="status-badge success">✅ Valid</span>}
                      {apiKey.isValid === false && <span className="status-badge error">❌ Invalid</span>}
                      {apiKey.isValid === 'testing' && <span className="status-badge testing">🔄 Testing...</span>}
                    </div>
                    
                    <div className="api-key-input-group">
                      <div className="input-wrapper">
                        <input
                          type="password"
                          placeholder={`Enter your ${apiKey.name} API key`}
                          value={apiKey.apiKey}
                          onChange={(e) => handleApiKeyChange(apiKey.id, e.target.value)}
                        />
                        <div className="input-border"></div>
                      </div>
                      <button
                        type="button"
                        className="test-btn"
                        onClick={() => handleTestApiKey(apiKey.id, apiKey.provider, apiKey.apiKey)}
                        disabled={!apiKey.apiKey.trim() || apiKey.isValid === 'testing'}
                      >
                        {apiKey.isValid === 'testing' ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="api-info">
                  <h4>🔒 Security Note:</h4>
                  <p>Your API keys are stored locally in your browser and are never transmitted to our servers. Make sure to keep them secure and never share them publicly.</p>
                </div>
              </div>
            )}

            {activeTab === 'prompts' && (
              <div className="section">
                <div className="section-header">
                  <span className="section-icon">💬</span>
                  <h2>Prompt Settings</h2>
                  <p className="section-description">Customize how your proposals are generated</p>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="defaultTone">
                      Default Tone
                      <span className="label-hint">Default writing style for proposals</span>
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="defaultTone"
                        value={settings.promptSettings.defaultTone}
                        onChange={(e) => handlePromptSettingChange('defaultTone', e.target.value)}
                      >
                        <option value="professional">🎩 Professional</option>
                        <option value="friendly">😊 Friendly</option>
                        <option value="casual">👋 Casual</option>
                        <option value="formal">📋 Formal</option>
                        <option value="enthusiastic">🚀 Enthusiastic</option>
                      </select>
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="defaultUrgency">
                      Default Urgency
                      <span className="label-hint">Default urgency level</span>
                    </label>
                    <div className="input-wrapper">
                      <select
                        id="defaultUrgency"
                        value={settings.promptSettings.defaultUrgency}
                        onChange={(e) => handlePromptSettingChange('defaultUrgency', e.target.value)}
                      >
                        <option value="low">🐌 Low Priority</option>
                        <option value="normal">⏰ Normal</option>
                        <option value="high">🔥 High Priority</option>
                        <option value="urgent">⚡ Urgent</option>
                      </select>
                      <div className="input-border"></div>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="maxWords">
                      Maximum Words
                      <span className="label-hint">Target length for proposals</span>
                    </label>
                    <div className="input-wrapper">
                      <input
                        id="maxWords"
                        type="number"
                        min="100"
                        max="2000"
                        placeholder="500"
                        value={settings.promptSettings.maxWords}
                        onChange={(e) => handlePromptSettingChange('maxWords', parseInt(e.target.value) || 500)}
                      />
                      <div className="input-border"></div>
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={settings.promptSettings.includePersonalInfo}
                          onChange={(e) => handlePromptSettingChange('includePersonalInfo', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Include Personal Info
                      </label>
                      <span className="checkbox-hint">Automatically include your contact details in proposals</span>
                    </div>

                    <div className="checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={settings.promptSettings.includeCallToAction}
                          onChange={(e) => handlePromptSettingChange('includeCallToAction', e.target.checked)}
                        />
                        <span className="checkmark"></span>
                        Include Call to Action
                      </label>
                      <span className="checkbox-hint">Add a compelling call-to-action at the end</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="customPromptPrefix">
                    Custom Prompt Prefix
                    <span className="label-hint">Text to add before the project description</span>
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="customPromptPrefix"
                      rows={3}
                      placeholder="e.g., 'As an experienced developer with 5+ years in web development...'"
                      value={settings.promptSettings.customPromptPrefix}
                      onChange={(e) => handlePromptSettingChange('customPromptPrefix', e.target.value)}
                    />
                    <div className="input-border"></div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="customPromptSuffix">
                    Custom Prompt Suffix
                    <span className="label-hint">Text to add after the project description</span>
                  </label>
                  <div className="input-wrapper">
                    <textarea
                      id="customPromptSuffix"
                      rows={3}
                      placeholder="e.g., 'I'm available to start immediately and would love to discuss this project further.'"
                      value={settings.promptSettings.customPromptSuffix}
                      onChange={(e) => handlePromptSettingChange('customPromptSuffix', e.target.value)}
                    />
                    <div className="input-border"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="actions">
            <button type="button" className="reset-btn" onClick={resetToDefaults}>
              <span className="btn-icon">🔄</span>
              Reset to Defaults
            </button>
            <button type="button" className="save-btn" onClick={handleSave}>
              <span className="btn-icon">💾</span>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default styled(Settings)`
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;

  .container {
    position: relative;
  }


  .settings-card {
    padding: 50px;
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
    }
  }

  .card-header {
    text-align: center;
    margin-bottom: 50px;
    
    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      margin-bottom: 24px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      
      .icon {
        font-size: 2.5rem;
        animation: rotate 8s linear infinite;
      }
    }
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  h1 {
    margin: 0 0 16px 0;
    background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 3rem;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.1;
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.2rem;
    font-weight: 400;
    margin: 0;
    line-height: 1.5;
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
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
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
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;

    .tab-icon {
      font-size: 1.1rem;
    }

    &:hover {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.05);
    }

    &.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
    }
  }

  .tab-content {
    min-height: 400px;
  }

  .section {
    margin-bottom: 50px;
    
    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 30px;
      
      .section-icon {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        backdrop-filter: blur(10px);
        flex-shrink: 0;
        margin-top: 4px;
      }
      
      div {
        flex: 1;
      }
      
      h2 {
        color: #fff;
        margin: 0 0 8px 0;
        font-weight: 700;
        font-size: 1.4rem;
        letter-spacing: -0.5px;
      }

      .section-description {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.95rem;
        margin: 0;
        line-height: 1.5;
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
    color: #fff;
    font-size: 1rem;
    line-height: 1.4;
    
    .label-hint {
      display: block;
      font-weight: 400;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      margin-top: 2px;
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
      background: linear-gradient(180deg, #2e4a6c 0%, #13345a 100%);
      transition: width 0.3s ease;
    }
  }

  input, select, textarea {
    width: 90%;
    padding: 16px 20px;
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    font-size: 15px;
    font-weight: 500;
    transition: all 0.3s ease;
    color: #fff;
    font-family: inherit;
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
    
    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-1px);
    }
    
    &:focus {
      outline: none;
      border-color: rgba(102, 126, 234, 0.5);
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
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
      background: #2e4a6c;
      color: #fff;
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
      content: '⚠️';
      font-size: 12px;
    }
  }

  .api-key-group {
    margin-bottom: 30px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .api-key-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    h3 {
      color: #fff;
      margin: 0;
      font-weight: 600;
      font-size: 1.1rem;
    }
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
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
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
      animation: pulse 2s infinite;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
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
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .api-info {
    margin-top: 30px;
    padding: 20px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    
    h4 {
      color: #3b82f6;
      margin: 0 0 8px 0;
      font-size: 1rem;
      font-weight: 600;
    }
    
    p {
      color: rgba(255, 255, 255, 0.8);
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }

  .checkbox-group {
    margin-bottom: 20px;
    
    label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      margin-bottom: 8px;
      
      input[type="checkbox"] {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .checkmark {
        width: 20px;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        position: relative;
        transition: all 0.3s ease;
        flex-shrink: 0;
        margin-top: 2px;
        
        &::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 6px;
          width: 6px;
          height: 10px;
          border: solid #fff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }
      
      input:checked + .checkmark {
        background: linear-gradient(180deg, #2e4a6c 0%, #13345a 100%);
        border-color: #667eea;
        
        &::after {
          opacity: 1;
        }
      }
      
      span:not(.checkmark) {
        font-weight: 600;
        color: #fff;
        line-height: 1.4;
      }
    }
    
    .checkbox-hint {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 400;
      margin-left: 32px;
      display: block;
      line-height: 1.4;
    }
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-top: 60px;
    padding-top: 40px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 16px;
    }
  }

  .reset-btn, .save-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 32px;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 160px;
    
    .btn-icon {
      font-size: 1.1rem;
    }
  }

  .reset-btn {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 2px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
      transform: translateY(-2px);
    }
  }

  .save-btn {
    background: #2a6ab8;
    color: white;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 
        0 15px 40px rgba(102, 126, 234, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
    
    &:active {
      transform: translateY(-1px);
    }
  }

  @media (max-width: 768px) {
    .container {
      padding: 20px 15px;
    }
    
    .settings-card {
      padding: 30px 25px;
      border-radius: 20px;
    }

    .card-header {
      margin-bottom: 40px;
      
      .icon-wrapper {
        width: 60px;
        height: 60px;
        margin-bottom: 20px;
        
        .icon {
          font-size: 2rem;
        }
      }
    }

    h1 {
      font-size: 2.2rem;
    }

    .subtitle {
      font-size: 1rem;
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

    .actions {
      .reset-btn, .save-btn {
        width: 100%;
      }
    }
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 1.8rem;
    }
    
    .subtitle {
      font-size: 0.9rem;
    }
    
    .settings-card {
      padding: 25px 20px;
    }
  }
`