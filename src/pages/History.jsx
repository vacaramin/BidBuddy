import styled from "styled-components";
import { useState, useEffect } from "preact/hooks";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";

const History = ({ className }) => {
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);

  useEffect(() => {
    const savedProposals = getFromStorage(STORAGE_KEYS.PROPOSALS, []);
    setProposals(savedProposals);
  }, []);

  const deleteProposal = (id) => {
    if (confirm("Are you sure you want to delete this proposal?")) {
      const updatedProposals = proposals.filter((p) => p.id !== id);
      setProposals(updatedProposals);
      saveToStorage(STORAGE_KEYS.PROPOSALS, updatedProposals);
      setSelectedProposal(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className={className}>
      <h1>Proposal History</h1>

      {proposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No proposals yet</h3>
          <p>Generate your first proposal to see it here!</p>
        </div>
      ) : (
        <div className="history-container">
          <div className="proposals-list">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className={`proposal-item ${selectedProposal?.id === proposal.id ? "selected" : ""}`}
                onClick={() => setSelectedProposal(proposal)}
              >
                <div className="proposal-header">
                  <span className="proposal-date">
                    {new Date(proposal.created_at).toLocaleDateString()}
                  </span>
                  <span className="proposal-provider">
                    {proposal.llm_provider}
                  </span>
                </div>
                <div className="proposal-description">
                  {proposal.project_description.substring(0, 150)}
                  {proposal.project_description.length > 150 && "..."}
                </div>
                <div className="proposal-model">
                  Model: {proposal.llm_model}
                </div>
              </div>
            ))}
          </div>

          {selectedProposal && (
            <div className="proposal-details">
              <div className="details-header">
                <h3>Proposal Details</h3>
                <div className="actions">
                  <button
                    className="copy-btn"
                    onClick={() =>
                      copyToClipboard(selectedProposal.prompt_used)
                    }
                  >
                    Copy Prompt
                  </button>
                  {selectedProposal.generated_proposal && (
                    <button
                      className="copy-btn"
                      onClick={() =>
                        copyToClipboard(selectedProposal.generated_proposal)
                      }
                    >
                      Copy Proposal
                    </button>
                  )}
                  <button
                    className="delete-btn"
                    onClick={() => deleteProposal(selectedProposal.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="details-content">
                <div className="detail-section">
                  <h4>Project Description:</h4>
                  <p>{selectedProposal.project_description}</p>
                </div>

                {selectedProposal.additional_notes && (
                  <div className="detail-section">
                    <h4>Additional Notes:</h4>
                    <p>{selectedProposal.additional_notes}</p>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Generated Prompt:</h4>
                  <div className="code-text">
                    <pre>{selectedProposal.prompt_used}</pre>
                  </div>
                </div>

                {selectedProposal.generated_proposal && (
                  <div className="detail-section">
                    <h4>Generated Proposal:</h4>
                    <div className="proposal-text">
                      <pre>{selectedProposal.generated_proposal}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default styled(History)`
  min-height: 100vh;
  background: #ffffff;
  padding: 0 20px;

  h1 {
    color: #333;
    margin-bottom: 40px;
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    h3 {
      color: #666;
      margin-bottom: 12px;
    }

    p {
      color: #888;
      margin: 0;
    }
  }

  .history-container {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 30px;
    height: calc(100vh - 120px);

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      height: auto;
    }
  }

  .proposals-list {
    border-right: 2px solid rgba(0, 0, 0, 0.1);
    padding-right: 20px;
    overflow-y: auto;
    max-height: 100%;

    @media (max-width: 1024px) {
      border-right: none;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);
      padding-right: 0;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
  }

  .proposal-item {
    padding: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: rgba(0, 0, 0, 0.2);
    }

    &.selected {
      border-color: #6296d3;
      background: rgba(98, 150, 211, 0.1);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(98, 150, 211, 0.2);
    }

    .proposal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .proposal-date {
        font-size: 0.9rem;
        color: #666;
        font-weight: 600;
      }

      .proposal-provider {
        background: rgba(0, 0, 0, 0.1);
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        color: #333;
        text-transform: uppercase;
      }
    }

    .proposal-description {
      color: #333;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .proposal-model {
      font-size: 0.8rem;
      color: #888;
      font-weight: 500;
    }
  }

  .proposal-details {
    overflow-y: auto;
    max-height: 100%;
    padding-left: 20px;

    @media (max-width: 1024px) {
      padding-left: 0;
    }

    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);

      h3 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
      }

      .actions {
        display: flex;
        gap: 12px;

        @media (max-width: 768px) {
          flex-direction: column;
          gap: 8px;
        }
      }
    }

    .copy-btn,
    .delete-btn {
      padding: 10px 16px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.05);
      color: #333;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.9rem;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
    }

    .delete-btn {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.5);
      }
    }

    .details-content {
      .detail-section {
        margin-bottom: 30px;

        h4 {
          color: #333;
          margin-bottom: 12px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        p {
          color: #555;
          line-height: 1.6;
          margin: 0;
        }
      }

      .code-text,
      .proposal-text {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 12px;
        padding: 20px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        margin-top: 8px;

        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          font-family: inherit;
          line-height: 1.6;
          color: #333;
          font-size: 0.95rem;
        }
      }

      .proposal-text {
        background: rgba(98, 150, 211, 0.05);
        border-color: rgba(98, 150, 211, 0.2);
      }
    }
  }

  @media (max-width: 768px) {
    padding: 0 15px;

    .history-container {
      gap: 20px;
    }

    .proposals-list {
      padding-right: 0;
    }

    .proposal-details {
      padding-left: 0;

      .details-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;

        .actions {
          width: 100%;

          button {
            flex: 1;
          }
        }
      }
    }
  }
`;
