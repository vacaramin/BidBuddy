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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Create a temporary success indicator
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = "Copied!";
      button.style.background = "rgba(16, 185, 129, 0.1)";
      button.style.borderColor = "rgba(16, 185, 129, 0.3)";
      button.style.color = "#10b981";

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "";
        button.style.borderColor = "";
        button.style.color = "";
      }, 2000);
    } catch (err) {
      alert("Failed to copy to clipboard");
    }
  };

  // Filter and sort proposals
  const filteredAndSortedProposals = proposals
    .filter((proposal) => {
      const matchesSearch = proposal.project_description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesProvider =
        filterProvider === "all" || proposal.llm_provider === filterProvider;
      return matchesSearch && matchesProvider;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "provider":
          return a.llm_provider.localeCompare(b.llm_provider);
        default:
          return 0;
      }
    });

  const getProviderIcon = (provider) => {
    return provider === "openai" ? "🤖" : "🧠";
  };

  const getStatusBadge = (proposal) => {
    if (proposal.generated_proposal) {
      return <span className="status-badge success">Generated</span>;
    }
    return <span className="status-badge prompt-only">Prompt Only</span>;
  };

  return (
    <div className={className}>
      <div className="header-section">
        <h1>Proposal History</h1>
        <p>View and manage all your generated proposals</p>
      </div>

      {proposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No proposals yet</h3>
          <p>Generate your first proposal to see it here!</p>
          <button
            className="cta-button"
            onClick={() => (window.location.href = "/proposal")}
          >
            Create Your First Proposal
          </button>
        </div>
      ) : (
        <>
          <div className="controls-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filters">
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Providers</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="provider">By Provider</option>
              </select>
            </div>
          </div>

          <div className="results-info">
            <span>
              {filteredAndSortedProposals.length} of {proposals.length}{" "}
              proposals
            </span>
          </div>

          <div className="history-container">
            <div className="proposals-list">
              {filteredAndSortedProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={`proposal-item ${selectedProposal?.id === proposal.id ? "selected" : ""}`}
                  onClick={() => setSelectedProposal(proposal)}
                >
                  <div className="proposal-header">
                    <div className="proposal-meta">
                      <span className="proposal-date">
                        {new Date(proposal.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                      <span className="proposal-time">
                        {new Date(proposal.created_at).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </span>
                    </div>
                    <div className="proposal-badges">
                      {getStatusBadge(proposal)}
                      <span className="proposal-provider">
                        {getProviderIcon(proposal.llm_provider)}{" "}
                        {proposal.llm_provider}
                      </span>
                    </div>
                  </div>
                  <div className="proposal-description">
                    {proposal.project_description.substring(0, 120)}
                    {proposal.project_description.length > 120 && "..."}
                  </div>
                  <div className="proposal-footer">
                    <span className="proposal-model">
                      {proposal.llm_model.toUpperCase()}
                    </span>
                    {proposal.generated_proposal && (
                      <span className="word-count">
                        {proposal.generated_proposal.split(" ").length} words
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedProposal && (
              <div className="proposal-details">
                <div className="details-header">
                  <div className="details-title">
                    <h3>Proposal Details</h3>
                    <div className="details-meta">
                      <span>
                        {new Date(selectedProposal.created_at).toLocaleString()}
                      </span>
                      <span className="separator">•</span>
                      <span>
                        {getProviderIcon(selectedProposal.llm_provider)}{" "}
                        {selectedProposal.llm_provider}
                      </span>
                      <span className="separator">•</span>
                      <span>{selectedProposal.llm_model.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="copy-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(selectedProposal.prompt_used);
                      }}
                    >
                      Copy Prompt
                    </button>
                    {selectedProposal.generated_proposal && (
                      <button
                        className="copy-btn primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(selectedProposal.generated_proposal);
                        }}
                      >
                        Copy Proposal
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProposal(selectedProposal.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="details-content">
                  <div className="detail-section">
                    <h4>Project Description</h4>
                    <div className="detail-text">
                      {selectedProposal.project_description}
                    </div>
                  </div>

                  {selectedProposal.additional_notes && (
                    <div className="detail-section">
                      <h4>Additional Notes</h4>
                      <div className="detail-text">
                        {selectedProposal.additional_notes}
                      </div>
                    </div>
                  )}

                  <div className="detail-section">
                    <h4>Generated Prompt</h4>
                    <div className="code-text">
                      <pre>{selectedProposal.prompt_used}</pre>
                    </div>
                  </div>

                  {selectedProposal.generated_proposal && (
                    <div className="detail-section">
                      <h4>Generated Proposal</h4>
                      <div className="proposal-text">
                        <pre>{selectedProposal.generated_proposal}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default styled(History)`
  min-height: calc(100vh - var(--topBarHeight));
  background: #ffffff;
  box-sizing: border-box;

  .header-section {
    margin-bottom: 30px;

    p {
      padding: 0px 20px;
      color: #666;
      margin: 0;
      font-size: 1.1rem;
    }
  }

  .empty-state {
    text-align: center;
    padding: 80px 20px;
    max-width: 500px;
    margin: 0 auto;
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    h3 {
      color: #666;
      margin-bottom: 12px;
      font-size: 1.5rem;
    }

    p {
      color: #888;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }

    .cta-button {
      background: linear-gradient(135deg, #6296d3 0%, #7bb1f1 100%);
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(98, 150, 211, 0.3);
      }
    }
  }

  .controls-section {
    padding: 0px 20px;
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;

    .search-bar {
      flex: 1;
      min-width: 250px;
    }

    .search-input {
      width: 100%;
      padding: 12px 20px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.02);
      font-size: 15px;
      transition: all 0.3s ease;
      box-sizing: border-box;
      color: var(--primaryTextColor);

      &:focus {
        outline: none;
        border-color: #6296d3;
        background: rgba(98, 150, 211, 0.05);
      }
    }

    .filters {
      display: flex;
      gap: 12px;
    }

    .filter-select {
      padding: 12px 16px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.02);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;

      color: var(--primaryTextColor);
      &:focus {
        outline: none;
        border-color: #6296d3;
      }
    }
  }

  .results-info {
    padding: 0px 20px;
    margin-bottom: 20px;
    color: #666;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .history-container {
    padding: 0px 20px;
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 30px;
    height: calc(100vh - 280px);
    min-height: 600px;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr 1fr;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      height: auto;
      gap: 20px;
    }
  }

  .proposals-list {
    padding-top: 20px;
    border-right: 2px solid rgba(0, 0, 0, 0.1);
    padding-right: 20px;
    overflow-y: auto;
    max-height: 100%;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;

      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }

    @media (max-width: 768px) {
      border-right: none;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);
      padding-right: 0;
      padding-bottom: 20px;
      margin-bottom: 20px;
      max-height: 400px;
    }
  }

  .proposal-item {
    padding: 20px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 16px;
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
      align-items: flex-start;
      margin-bottom: 12px;
      gap: 12px;

      .proposal-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .proposal-date {
          font-size: 0.9rem;
          color: #333;
          font-weight: 600;
        }

        .proposal-time {
          font-size: 0.8rem;
          color: #888;
        }
      }

      .proposal-badges {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;

      &.success {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      &.prompt-only {
        background: rgba(251, 191, 36, 0.2);
        color: #d97706;
      }
    }

    .proposal-provider {
      background: rgba(0, 0, 0, 0.1);
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
    }

    .proposal-description {
      color: #333;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .proposal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: #888;

      .proposal-model {
        font-weight: 600;
      }

      .word-count {
        font-style: italic;
      }
    }
  }

  .proposal-details {
    padding-top: 20px;
    overflow-y: auto;
    max-height: 100%;
    padding-left: 20px;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;

      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }

    @media (max-width: 768px) {
      padding-left: 0;
    }

    .details-header {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid rgba(0, 0, 0, 0.1);

      .details-title {
        margin-bottom: 20px;

        h3 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .details-meta {
          color: #666;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;

          .separator {
            color: #ccc;
          }
        }
      }

      .actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;

        @media (max-width: 768px) {
          flex-direction: column;
        }
      }
    }

    .copy-btn,
    .delete-btn {
      padding: 12px 20px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-radius: 10px;
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

      &.primary {
        background: linear-gradient(135deg, #6296d3 0%, #7bb1f1 100%);
        color: white;
        border-color: #6296d3;

        &:hover {
          background: linear-gradient(135deg, #5285c2 0%, #6aa0e0 100%);
          border-color: #5285c2;
        }
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
        margin-bottom: 32px;

        h4 {
          color: #333;
          margin-bottom: 16px;
          font-size: 1.2rem;
          font-weight: 700;
        }

        .detail-text {
          color: #555;
          line-height: 1.6;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.03);
          border-radius: 12px;
          border-left: 4px solid #6296d3;
        }
      }

      .code-text,
      .proposal-text {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 12px;
        padding: 20px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        overflow-x: auto;

        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
          line-height: 1.6;
          color: #333;
          font-size: 0.9rem;
        }
      }

      .proposal-text {
        background: rgba(98, 150, 211, 0.05);
        border-color: rgba(98, 150, 211, 0.2);

        pre {
          font-family: inherit;
          font-size: 0.95rem;
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding: 20px 15px;

    .controls-section {
      flex-direction: column;
      align-items: stretch;

      .search-bar {
        min-width: auto;
      }

      .filters {
        justify-content: space-between;

        .filter-select {
          flex: 1;
        }
      }
    }

    .header-section h1 {
      font-size: 1.8rem;
    }

    .history-container {
      min-height: 500px;
    }
  }

  @media (max-width: 480px) {
    .proposal-item {
      padding: 16px;

      .proposal-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .proposal-badges {
          flex-direction: row;
          align-items: center;
        }
      }
    }

    .details-header .actions {
      gap: 8px;

      button {
        font-size: 0.8rem;
        padding: 10px 16px;
      }
    }
  }
`;
