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

      
      <div className="container">
        <div className="proposal-card">

          <form onSubmit={handleSubmit} className="proposal-form">
            <div className="section">
              <div className="section-header">
                <span className="section-icon">📋</span>
                <h2>Project Information</h2>
              </div>
              
              <div className="form-group">
                <label htmlFor="project_description">
                  Project Description *
                  <span className="label-hint">paste the project posting here</span>
                </label>
                <div className="input-wrapper">
                  <textarea
                    id="project_description"
                    rows={4}
                    placeholder="Paste the project description from the job posting or describe your project in detail..."
                    value={formData.project_description}
                    onChange={(e) => handleInputChange('project_description', e.target.value)}
                    className={errors.project_description ? 'error' : ''}
                  />
                  <div className="input-border"></div>
                </div>
                {errors.project_description && <span className="error-message">{errors.project_description}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="llm_model">
                    AI Model *
                    <span className="label-hint">Choose your AI assistant</span>
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="llm_model"
                      value={formData.llm_model}
                      onChange={(e) => handleInputChange('llm_model', e.target.value)}
                      className={errors.llm_model ? 'error' : ''}
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
                  {errors.llm_model && <span className="error-message">{errors.llm_model}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="conversation_type">
                    Proposal Type *
                    <span className="label-hint">What style do you need?</span>
                  </label>
                  <div className="input-wrapper">
                    <select
                      id="conversation_type"
                      value={formData.conversation_type}
                      onChange={(e) => handleInputChange('conversation_type', e.target.value)}
                      className={errors.conversation_type ? 'error' : ''}
                    >
                      <option value="">What kind of response do you need?</option>
                      <option value="proper_proposal">📄 Formal Proposal</option>
                      <option value="conversational">💬 Conversational Message</option>
                      <option value="message_reply">⚡ Quick Reply</option>
                      <option value="follow_up">🔄 Follow-up Message</option>
                      <option value="cold_outreach">🎯 Cold Outreach</option>
                      <option value="bid_response">🏆 Competitive Bid</option>
                    </select>
                    <div className="input-border"></div>
                  </div>
                  {errors.conversation_type && <span className="error-message">{errors.conversation_type}</span>}
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
                  <span className="label-hint">Any specific requirements or context</span>
                </label>
                <div className="input-wrapper">
                  <textarea
                    id="additional_notes"
                    rows={3}
                    placeholder="Share any specific requirements, deadlines, budget constraints, or special points you want to highlight..."
                    value={formData.additional_notes}
                    onChange={(e) => handleInputChange('additional_notes', e.target.value)}
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
              <p className="submit-hint">Your AI-powered proposal will be ready in seconds</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default styled(GenerateProposal)`
  min-height: 100vh;
  background: linear-gradient(180deg, #2e4a6c 0%, #13345a 100%);
  position: relative;
  overflow-x: hidden;

  .background-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
  }

  .floating-shapes {
    position: absolute;
    width: 100%;
    height: 100%;
    
    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(1px);
      animation: float 20s infinite ease-in-out;
      
      &.shape-1 {
        width: 300px;
        height: 300px;
        top: 10%;
        right: -5%;
        animation-delay: 0s;
      }
      
      &.shape-2 {
        width: 200px;
        height: 200px;
        top: 60%;
        right: -5%;
        animation-delay: 5s;
      }
      
      &.shape-3 {
        width: 150px;
        height: 150px;
        top: 30%;
        right: 20%;
        animation-delay: 10s;
      }
      
      &.shape-4 {
        width: 250px;
        height: 250px;
        bottom: 10%;
        right: -5%;
        animation-delay: 15s;
      }
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
    25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
    50% { transform: translateY(-10px) translateX(-10px) rotate(180deg); }
    75% { transform: translateY(-30px) translateX(5px) rotate(270deg); }
  }

  .container {
    position: relative;
    z-index: 1;
    padding: 40px 20px;
  }

  .proposal-card {
    backdrop-filter: blur(20px);
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
        animation: pulse 3s infinite ease-in-out;
      }
    }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
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
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        backdrop-filter: blur(10px);
      }
      
      h2 {
        color: #fff;
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
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    }
  }

  input, select, textarea {
    width: 100%;
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

  .submit-section {
    text-align: center;
    margin-top: 60px;
    
    .submit-hint {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      margin-top: 16px;
      margin-bottom: 0;
    }
  }

  .generate-btn {
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 16px;
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
      0 10px 30px rgba(102, 126, 234, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    overflow: hidden;
    
    .btn-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transform: rotate(45deg);
      transition: all 0.6s ease;
      opacity: 0;
    }
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 
        0 15px 40px rgba(102, 126, 234, 0.5),
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
    .container {
      padding: 20px 15px;
    }
    
    .proposal-card {
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

    .generate-btn {
      min-width: 200px;
      font-size: 1.1rem;
      height: 55px;
    }
  }

  @media (max-width: 480px) {
    h1 {
      font-size: 1.8rem;
    }
    
    .subtitle {
      font-size: 0.9rem;
    }
    
    .proposal-card {
      padding: 25px 20px;
    }
  }
`;