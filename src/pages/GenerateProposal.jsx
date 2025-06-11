
import { useState } from "preact/hooks";
import styled from 'styled-components';

const GenerateProposal = ({ className }) => {
  const [formData, setFormData] = useState({
    project_description: '',
    llm_model: 'gpt-4',
    llm_provider: 'openai',
    conversation_type: 'proper_proposal',
    tone: 'professional',
    urgency: 'normal',
    additional_notes: ''
  });

  const [errors, setErrors] = useState({});

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
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.project_description.trim()) {
      newErrors.project_description = 'Please describe the project!';
    }
    if (!formData.llm_model) {
      newErrors.llm_model = 'Please select an LLM model!';
    }
    if (!formData.conversation_type) {
      newErrors.conversation_type = 'Please select proposal type!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Success:', formData);
    }
  };

  return (
    <div className={className}>
      <div className="proposal-card">
        <h1>Proposal Generator</h1>
        <div onSubmit={handleSubmit}>
          <h2>Project Information</h2>
          
          <div className="form-group">
            <label htmlFor="project_description">Project Description *</label>
            <textarea
              id="project_description"
              rows={4}
              placeholder="Paste the project description from the job posting..."
              value={formData.project_description}
              onChange={(e) => handleInputChange('project_description', e.target.value)}
              className={errors.project_description ? 'error' : ''}
            />
            {errors.project_description && <span className="error-message">{errors.project_description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="llm_model">LLM Model *</label>
            <select
              id="llm_model"
              value={formData.llm_model}
              onChange={(e) => handleInputChange('llm_model', e.target.value)}
              className={errors.llm_model ? 'error' : ''}
            >
              <option value="">Choose AI model for generation</option>
              <option value="gpt-4">GPT-4 (Recommended)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3 Sonnet</option>
              <option value="claude-2">Claude 2</option>
              <option value="gemini-pro">Gemini Pro</option>
              <option value="custom">Custom Model</option>
            </select>
            {errors.llm_model && <span className="error-message">{errors.llm_model}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="conversation_type">Proposal Type *</label>
            <select
              id="conversation_type"
              value={formData.conversation_type}
              onChange={(e) => handleInputChange('conversation_type', e.target.value)}
              className={errors.conversation_type ? 'error' : ''}
            >
              <option value="">What kind of response do you need?</option>
              <option value="proper_proposal">Formal Proposal</option>
              <option value="conversational">Conversational Message</option>
              <option value="message_reply">Quick Reply</option>
              <option value="follow_up">Follow-up Message</option>
              <option value="cold_outreach">Cold Outreach</option>
              <option value="bid_response">Competitive Bid</option>
            </select>
            {errors.conversation_type && <span className="error-message">{errors.conversation_type}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="additional_notes">Additional Notes (Optional)</label>
            <textarea
              id="additional_notes"
              rows={3}
              placeholder="Any specific requirements or points you want to include..."
              value={formData.additional_notes}
              onChange={(e) => handleInputChange('additional_notes', e.target.value)}
            />
          </div>

          <div className="submit-section">
            <button type="button" onClick={handleSubmit} className="generate-btn">
              🚀 Generate Proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default styled(GenerateProposal)`
  min-height: 100vh;
  
  .proposal-card {
    backdrop-filter: blur(10px);
    padding: 0px 50px;
  }

  h1 {
    text-align: center;
    margin-bottom: 30px;
    background: #fff;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  h2 {
    color: #fff;
    margin: 35px 0 25px 0;
    font-weight: 600;
    font-size: 1.1rem;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .form-group {
    margin-bottom: 24px;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #fff;
    font-size: 0.95rem;
  }

  input, select, textarea {
    max-width: 100%;
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e8ecef;
    background: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    transition: all 0.3s ease;
    color: #13345a;
    
    &:hover {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    }

    &.error {
      border-color: #ff4d4f;
    }

    &::placeholder {
      color: #999;
    }
  }

  select {
    cursor: pointer;
    
    option {
      padding: 10px;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  .error-message {
    display: block;
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
  }

  .submit-section {
    margin-top: 40px;
    text-align: center;
  }

  .generate-btn {
    background: linear-gradient(180deg, #2e4a6c 0%, #13345a 100%);
    border: none;
    border-radius: 12px;
    height: 50px;
    font-size: 1.1rem;
    font-weight: 600;
    min-width: 200px;
    color: white;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
    }
    
    &:active {
      transform: translateY(0px);
    }
  }

  @media (max-width: 768px) {
    .proposal-card {
      padding: 20px;
      margin: 10px;
    }

    h1 {
      font-size: 2rem;
    }

    .generate-btn {
      min-width: 150px;
      font-size: 1rem;
    }
  }
`;