import styled from "styled-components";
import { useEffect, useState } from "preact/hooks";
import { Link } from "preact-router";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  PenLine,
  Search,
  Trash2,
} from "lucide-preact";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";
import { getModels, getProvider, PROVIDERS } from "../utils/models";
import ProviderLogo from "../components/ProviderLogo";

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const groupLabel = (iso) => {
  const date = new Date(iso);
  const diffDays = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86400000,
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This week";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const formatWhen = (iso, label) => {
  const date = new Date(iso);
  if (label === "Today" || label === "Yesterday") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusOf = (proposal) => {
  if (proposal.generation_error) return { label: "Failed", tone: "failed" };
  if (proposal.generated_proposal) return { label: "Generated", tone: "success" };
  return { label: "Prompt only", tone: "prompt-only" };
};

const modelName = (providerId, modelId) =>
  getModels(providerId).find((model) => model.id === modelId)?.name || modelId;

const History = ({ className }) => {
  const [proposals, setProposals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvider, setFilterProvider] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setProposals(getFromStorage(STORAGE_KEYS.PROPOSALS, []));
  }, []);

  const deleteProposal = (id) => {
    if (!confirm("Delete this proposal? This cannot be undone.")) return;
    const updatedProposals = proposals.filter((proposal) => proposal.id !== id);
    setProposals(updatedProposals);
    saveToStorage(STORAGE_KEYS.PROPOSALS, updatedProposals);
  };

  const filteredProposals = proposals
    .filter((proposal) => {
      const description = (proposal.project_description || "").toLowerCase();
      const matchesSearch = description.includes(searchTerm.toLowerCase());
      const matchesProvider =
        filterProvider === "all" || proposal.llm_provider === filterProvider;
      return matchesSearch && matchesProvider;
    })
    .sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });

  const groups = filteredProposals.reduce((list, proposal) => {
    const label = groupLabel(proposal.created_at);
    const current = list[list.length - 1];
    if (!current || current.label !== label) {
      list.push({ label, items: [proposal] });
    } else {
      current.items.push(proposal);
    }
    return list;
  }, []);

  const filtersActive = searchTerm.trim() !== "" || filterProvider !== "all";

  return (
    <div className={className}>
      <header className="page-header">
        <p>Open a saved prompt or proposal, or remove one you no longer need.</p>
        <Link href="/proposal" className="header-action">
          <PenLine size={16} />
          <span>New proposal</span>
        </Link>
      </header>

      {proposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={28} />
          </div>
          <h2>No proposals yet</h2>
          <p>Anything you generate will be listed here.</p>
          <Link href="/proposal" className="header-action">
            <PenLine size={16} />
            <span>New proposal</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <label className="search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search by description"
                value={searchTerm}
                onInput={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <div className="toolbar-filters">
              <label className="filter-select">
                <select
                  value={filterProvider}
                  onChange={(event) => setFilterProvider(event.target.value)}
                  aria-label="Filter by provider"
                >
                  <option value="all">All providers</option>
                  {PROVIDERS.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
              <label className="filter-select">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  aria-label="Sort proposals"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
            </div>
          </div>

          <p className="results-count">
            {filtersActive
              ? `${filteredProposals.length} of ${proposals.length}`
              : `${proposals.length}`}{" "}
            {proposals.length === 1 ? "proposal" : "proposals"}
          </p>

          {filteredProposals.length === 0 ? (
            <div className="empty-state compact">
              <h2>No matches</h2>
              <p>Try a different description or provider.</p>
              <button
                type="button"
                className="text-action"
                onClick={() => {
                  setSearchTerm("");
                  setFilterProvider("all");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="groups">
              {groups.map((group) => (
                <section key={group.label} className="group">
                  <h2>{group.label}</h2>
                  <ul>
                    {group.items.map((proposal) => {
                      const status = statusOf(proposal);
                      const providerName =
                        getProvider(proposal.llm_provider)?.name ||
                        proposal.llm_provider;
                      const words = proposal.generated_proposal
                        ? proposal.generated_proposal.trim().split(/\s+/).length
                        : 0;

                      return (
                        <li key={proposal.id}>
                          <div className="history-row">
                            <Link
                              href={`/proposal?id=${proposal.id}`}
                              className="row-link"
                            >
                              <div className="row-copy">
                                <p className="row-title">
                                  {proposal.project_description}
                                </p>
                                <p className="row-meta">
                                  <span className="provider">
                                    <ProviderLogo
                                      provider={proposal.llm_provider}
                                      size={14}
                                    />
                                    {providerName}
                                  </span>
                                  {proposal.llm_model && (
                                    <span>
                                      {modelName(
                                        proposal.llm_provider,
                                        proposal.llm_model,
                                      )}
                                    </span>
                                  )}
                                  <span>
                                    {formatWhen(
                                      proposal.created_at,
                                      group.label,
                                    )}
                                  </span>
                                  {words > 0 && <span>{words} words</span>}
                                </p>
                              </div>
                              <span className={`status ${status.tone}`}>
                                {status.label}
                              </span>
                              <ChevronRight size={18} className="chevron" />
                            </Link>
                            <button
                              type="button"
                              className="delete-btn"
                              aria-label="Delete proposal"
                              onClick={() => deleteProposal(proposal.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default styled(History)`
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #ffffff;

  &,
  & * {
    box-sizing: border-box;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    p {
      margin: 0;
      max-width: 40rem;
      color: #667085;
      font-size: 0.98rem;
      line-height: 1.5;
    }
  }

  .header-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 10px 16px;
    border-radius: 12px;
    background: #6296d3;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;

    &:hover {
      background: #3969a0;
    }
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    height: 44px;
    min-height: 44px;
    min-width: 0;
    padding: 0 14px;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;
    color: #98a2b3;

    &:focus-within {
      border-color: #6296d3;
      color: #3969a0;
    }

    input {
      width: 100%;
      height: 100%;
      min-width: 0;
      padding: 0;
      border: none;
      background: transparent;
      color: #1c1c1c;
      font-size: 0.95rem;

      &:focus {
        outline: none;
      }
    }
  }

  .toolbar-filters {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .filter-select {
    position: relative;
    display: inline-flex;
    align-items: center;
    height: 44px;
    margin: 0;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;

    &:hover {
      border-color: #d0d5dd;
      background: #f8fafc;
    }

    &:focus-within {
      border-color: #6296d3;
      background: #ffffff;
    }

    select {
      appearance: none;
      -webkit-appearance: none;
      height: 42px;
      margin: 0;
      padding: 0 40px 0 14px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: #1c1c1c;
      font-family: inherit;
      font-size: 0.92rem;
      font-weight: 600;
      line-height: 42px;
      cursor: pointer;

      &:focus {
        outline: none;
      }
    }

    svg {
      position: absolute;
      top: 50%;
      right: 12px;
      width: 16px;
      height: 16px;
      transform: translateY(-50%);
      color: #667085;
      pointer-events: none;
    }
  }

  .results-count {
    margin: -8px 0 0;
    color: #98a2b3;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .groups {
    display: flex;
    flex-direction: column;
    gap: 22px;
    margin: 0;
    padding-bottom: 24px;
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: 10px;

    h2 {
      margin: 0;
      color: #667085;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    ul {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  }

  .history-row {
    display: flex;
    align-items: center;
    gap: 4px;
    border: 1px solid #e6e8ec;
    border-radius: 14px;
    background: #ffffff;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;

    &:hover {
      border-color: rgba(98, 150, 211, 0.55);
      background: #f7fafd;
    }
  }

  .row-link {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
    padding: 16px 8px 16px 16px;
    color: inherit;
    text-decoration: none;

    &:focus-visible {
      outline: 2px solid #6296d3;
      outline-offset: 2px;
      border-radius: 12px;
    }
  }

  .row-copy {
    flex: 1;
    min-width: 0;
  }

  .row-title {
    margin: 0;
    color: #1c1c1c;
    font-size: 0.98rem;
    font-weight: 600;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .row-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 0;
    margin: 6px 0 0;
    color: #667085;
    font-size: 0.84rem;
    line-height: 1.4;

    span {
      display: inline-flex;
      align-items: center;
    }

    span:not(:last-child)::after {
      content: "·";
      margin: 0 8px;
      color: #c5cad3;
    }
  }

  .provider {
    gap: 6px;

    img {
      width: 14px;
      height: 14px;
      object-fit: contain;
    }
  }

  .status {
    flex-shrink: 0;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;

    &.success {
      background: rgba(16, 185, 129, 0.12);
      color: #047857;
    }

    &.prompt-only {
      background: rgba(251, 191, 36, 0.18);
      color: #b45309;
    }

    &.failed {
      background: rgba(185, 28, 28, 0.1);
      color: #b91c1c;
    }
  }

  .chevron {
    flex-shrink: 0;
    color: #98a2b3;
  }

  .row-link:hover .chevron {
    color: #3969a0;
  }

  .delete-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-right: 10px;
    padding: 0;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #98a2b3;
    cursor: pointer;

    &:hover {
      background: rgba(185, 28, 28, 0.08);
      color: #b91c1c;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 64px 20px;
    text-align: center;

    h2 {
      margin: 8px 0 0;
      color: #1c1c1c;
      font-size: 1.15rem;
      font-weight: 700;
    }

    p {
      margin: 0 0 12px;
      color: #667085;
      font-size: 0.95rem;
    }

    &.compact {
      padding: 32px 20px;
      border: 1px dashed #e6e8ec;
      border-radius: 14px;
    }
  }

  .empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(98, 150, 211, 0.12);
    color: #3969a0;
  }

  .text-action {
    border: none;
    background: transparent;
    color: #3969a0;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  @media (max-width: 720px) {
    .page-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .toolbar-filters {
      width: 100%;
    }

    .filter-select {
      flex: 1;
      min-width: 0;
    }

    .filter-select select {
      width: 100%;
    }

    .history-row {
      align-items: flex-start;
    }

    .row-link {
      align-items: flex-start;
      padding-top: 14px;
      padding-bottom: 14px;
    }

    .status {
      margin-top: 2px;
    }

    .delete-btn {
      margin-top: 8px;
    }
  }
`;
