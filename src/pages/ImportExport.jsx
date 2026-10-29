import { useState, useEffect } from "preact/hooks";
import styled from "styled-components";
import {
  Download,
  Upload,
  FileText,
  Settings,
  History,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-preact";
import {
  getFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from "../utils/localStorage";
import {
  DEFAULT_PROFILE_NAME,
  getActiveProfile,
  loadStore,
  normalizeStore,
  saveStore,
} from "../utils/profiles";

const ImportExport = ({ className }) => {
  const [exportData, setExportData] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedExportItems, setSelectedExportItems] = useState({
    settings: true,
    proposals: true,
    analytics: true,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const exportItems = [
    {
      key: "settings",
      label: "Profile setup",
      icon: <Settings size={16} />,
      description: "Profiles, shared API keys, and prompt settings",
      storageKey: STORAGE_KEYS.SETTINGS,
    },
    {
      key: "proposals",
      label: "Proposal History",
      icon: <History size={16} />,
      description: "All saved proposals and project data",
      storageKey: STORAGE_KEYS.PROPOSALS,
    },
    {
      key: "analytics",
      label: "Analytics Data",
      icon: <BarChart3 size={16} />,
      description: "Usage statistics and performance metrics",
      storageKey: STORAGE_KEYS.ANALYTICS,
    },
  ];

  // Generate export data when component mounts or selection changes
  useEffect(() => {
    generateExportData();
  }, [selectedExportItems]);

  const generateExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: "1.0.0",
      data: {},
    };

    exportItems.forEach((item) => {
      if (selectedExportItems[item.key]) {
        const itemData =
          item.key === "settings"
            ? loadStore()
            : getFromStorage(item.storageKey, null);
        if (itemData) {
          data.data[item.key] = itemData;
        }
      }
    });

    setExportData(data);
  };

  const handleExportItemToggle = (key) => {
    setSelectedExportItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExport = () => {
    if (!exportData || Object.keys(exportData.data).length === 0) {
      setMessage({
        type: "error",
        text: "No data selected for export or no data available to export.",
      });
      return;
    }

    const fileName = `bidbuddy-backup-${new Date().toISOString().split("T")[0]}.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setMessage({
      type: "success",
      text: `Configuration exported successfully as ${fileName}`,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        setMessage({
          type: "error",
          text: "Please select a valid JSON file.",
        });
        return;
      }
      setImportFile(file);
      setMessage({ type: "", text: "" });
    }
  };

  const validateImportData = (data) => {
    if (!data || typeof data !== "object") {
      return "Invalid file format. Expected JSON object.";
    }

    if (!data.version || !data.exportDate || !data.data) {
      return "Invalid backup file structure. Missing required fields.";
    }

    // Check if it's a BidBuddy backup file
    const hasValidData = Object.keys(data.data).some((key) =>
      exportItems.find((item) => item.key === key),
    );

    if (!hasValidData) {
      return "This doesn't appear to be a valid BidBuddy backup file.";
    }

    return null;
  };

  const previewImportData = async () => {
    if (!importFile) return;

    setIsProcessing(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      const validationError = validateImportData(data);
      if (validationError) {
        setMessage({ type: "error", text: validationError });
        setIsProcessing(false);
        return;
      }

      setPreviewData(data);
      setShowPreview(true);
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error reading file. Please ensure it's a valid JSON file.",
      });
    }
    setIsProcessing(false);
  };

  const handleImport = (mergeMode = false) => {
    if (!previewData) return;

    setIsProcessing(true);
    let importedCount = 0;

    try {
      Object.entries(previewData.data).forEach(([key, value]) => {
        const exportItem = exportItems.find((item) => item.key === key);
        if (exportItem) {
          if (mergeMode && key === "proposals") {
            // For proposals, merge with existing data
            const existing = getFromStorage(exportItem.storageKey, []);
            const merged = [...existing];

            // Add new proposals, avoiding duplicates by ID
            value.forEach((newProposal) => {
              if (!existing.find((p) => p.id === newProposal.id)) {
                merged.push(newProposal);
              }
            });

            saveToStorage(exportItem.storageKey, merged);
          } else if (key === "settings") {
            saveStore(normalizeStore(value));
          } else {
            // For analytics, or replace mode, overwrite completely
            saveToStorage(exportItem.storageKey, value);
          }
          importedCount++;
        }
      });

      setMessage({
        type: "success",
        text: `Successfully imported ${importedCount} data categories. Please refresh the page to see changes.`,
      });

      setShowPreview(false);
      setImportFile(null);
      setPreviewData(null);

      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error importing data. Please try again.",
      });
    }

    setIsProcessing(false);
  };

  const getDataStats = (data) => {
    const stats = {};

    if (data.settings) {
      const normalized = normalizeStore(data.settings);
      const active = getActiveProfile(normalized);
      stats.settings = {
        profileCount: normalized.profiles.length,
        activeName: active?.name || DEFAULT_PROFILE_NAME,
        hasApiKeys:
          normalized.apiKeys?.some((key) => key.apiKey?.trim()) || false,
        hasPromptSettings: normalized.profiles.some(
          (profile) =>
            profile.promptSettings?.customPromptPrefix ||
            profile.promptSettings?.customPromptSuffix,
        ),
      };
    }

    if (data.proposals) {
      stats.proposals = {
        count: Array.isArray(data.proposals) ? data.proposals.length : 0,
        withContent: Array.isArray(data.proposals)
          ? data.proposals.filter((p) => p.generated_proposal).length
          : 0,
      };
    }

    if (data.analytics) {
      stats.analytics = {
        hasData: !!(data.analytics && Object.keys(data.analytics).length > 0),
      };
    }

    return stats;
  };

  const clearMessage = () => {
    setMessage({ type: "", text: "" });
  };

  const itemHasData = (key, storageKey) => {
    if (key === "settings") {
      const store = loadStore();
      return store.profiles.length > 0;
    }
    const itemData = getFromStorage(storageKey, null);
    if (!itemData) return false;
    return Array.isArray(itemData)
      ? itemData.length > 0
      : Object.keys(itemData).length > 0;
  };

  const canExport = exportItems.some(
    (item) =>
      selectedExportItems[item.key] && itemHasData(item.key, item.storageKey),
  );

  return (
    <div className={className}>
      <header className="page-header">
        <p>Save a backup of your settings and proposals, or restore one.</p>
      </header>

      {message.text && (
        <div className={`message ${message.type}`}>
          <div className="message-content">
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            className="message-close"
            onClick={clearMessage}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="main-content">
        {/* Export Section */}
        <div className="section export-section">
          <div className="section-header">
            <div className="section-icon">
              <Download size={18} />
            </div>
            <div>
              <h2>Export</h2>
              <p>Choose what goes in the backup file.</p>
            </div>
          </div>

          <div className="export-options">
            {exportItems.map((item) => {
              const itemData =
                item.key === "settings"
                  ? loadStore()
                  : getFromStorage(item.storageKey, null);
              const hasData = itemHasData(item.key, item.storageKey);
              const settingsStats =
                item.key === "settings" && itemData
                  ? {
                      count: itemData.profiles?.length || 0,
                      active:
                        getActiveProfile(itemData)?.name || DEFAULT_PROFILE_NAME,
                      hasKeys:
                        itemData.apiKeys?.some((key) => key.apiKey?.trim()) ||
                        false,
                    }
                  : null;

              return (
                <label
                  key={item.key}
                  className={`export-item${!hasData ? " no-data" : ""}${
                    selectedExportItems[item.key] && hasData ? " selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedExportItems[item.key] && hasData}
                    onChange={() => handleExportItemToggle(item.key)}
                    disabled={!hasData}
                  />
                  <span className="checkmark"></span>

                  <div className="export-item-content">
                    <div className="export-item-header">
                      {item.icon}
                      <h3>{item.label}</h3>
                      {!hasData && <span className="no-data-badge">Empty</span>}
                    </div>
                    <p>{item.description}</p>

                    {hasData && (
                      <div className="data-preview">
                        {item.key === "proposals" &&
                          Array.isArray(itemData) && (
                            <span>
                              {itemData.length}{" "}
                              {itemData.length === 1
                                ? "proposal"
                                : "proposals"}{" "}
                              saved
                            </span>
                          )}
                        {item.key === "settings" && settingsStats && (
                          <span>
                            {settingsStats.count}{" "}
                            {settingsStats.count === 1 ? "profile" : "profiles"}
                            {" · Active: "}
                            {settingsStats.active}
                            {settingsStats.hasKeys
                              ? " · API keys set"
                              : " · No API keys"}
                          </span>
                        )}
                        {item.key === "analytics" && itemData && (
                          <span>Analytics data available</span>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            className="export-btn"
            onClick={handleExport}
            disabled={!canExport}
          >
            <Download size={16} />
            Download backup
          </button>
        </div>

        {/* Import Section */}
        <div className="section import-section">
          <div className="section-header">
            <div className="section-icon">
              <Upload size={18} />
            </div>
            <div>
              <h2>Import</h2>
              <p>Restore from a backup file.</p>
            </div>
          </div>

          <div className="import-area">
            <div className="file-upload">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                id="import-file"
                className="file-input"
              />
              <label htmlFor="import-file" className="file-label">
                <span className="file-icon">
                  <FileText size={18} />
                </span>
                <div className="file-label-text">
                  <span className="file-label-title">Choose a backup</span>
                  <span className="file-label-subtitle">
                    JSON file exported from Bid buddy
                  </span>
                </div>
              </label>
            </div>

            {importFile && (
              <div className="file-info">
                <div className="file-details">
                  <FileText size={20} />
                  <div>
                    <div className="file-name">{importFile.name}</div>
                    <div className="file-size">
                      {(importFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="preview-btn"
                  onClick={previewImportData}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Reading..." : "Preview"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Import Preview</h3>
              <button
                className="modal-close"
                onClick={() => setShowPreview(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="preview-info">
                <div className="preview-meta">
                  <div className="meta-item">
                    <strong>Export Date:</strong>{" "}
                    {new Date(previewData.exportDate).toLocaleString()}
                  </div>
                  <div className="meta-item">
                    <strong>Version:</strong> {previewData.version}
                  </div>
                </div>
              </div>

              <div className="preview-data">
                <h4>Data to be imported:</h4>
                {Object.entries(previewData.data).map(([key, value]) => {
                  const item = exportItems.find((i) => i.key === key);
                  const stats = getDataStats(previewData.data);

                  return (
                    <div key={key} className="preview-item">
                      <div className="preview-item-header">
                        {item?.icon}
                        <span>{item?.label || key}</span>
                      </div>
                      <div className="preview-item-details">
                        {key === "proposals" && stats.proposals && (
                          <span>
                            {stats.proposals.count} proposals (
                            {stats.proposals.withContent} with generated
                            content)
                          </span>
                        )}
                        {key === "settings" && stats.settings && (
                          <span>
                            {stats.settings.profileCount}{" "}
                            {stats.settings.profileCount === 1
                              ? "profile"
                              : "profiles"}
                            {" · Active: "}
                            {stats.settings.activeName}
                            {stats.settings.hasApiKeys
                              ? " · API keys"
                              : " · No API keys"}
                            {stats.settings.hasPromptSettings
                              ? " · Prompt settings"
                              : " · No prompt settings"}
                          </span>
                        )}
                        {key === "analytics" && stats.analytics && (
                          <span>
                            {stats.analytics.hasData
                              ? "Analytics included"
                              : "No analytics"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="import-warning">
                <AlertTriangle size={20} />
                <div>
                  <strong>Import Mode:</strong>
                  <p>
                    <strong>Replace:</strong> Completely replace existing data
                    with imported data
                  </p>
                  <p>
                    <strong>Merge:</strong> Keep existing data and add new items
                    (recommended for proposals)
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowPreview(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="replace-btn"
                onClick={() => handleImport(false)}
                disabled={isProcessing}
              >
                {isProcessing ? "Importing..." : "Replace"}
              </button>
              <button
                type="button"
                className="merge-btn"
                onClick={() => handleImport(true)}
                disabled={isProcessing}
              >
                {isProcessing ? "Importing..." : "Merge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default styled(ImportExport)`
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

  .page-header p {
    margin: 0;
    max-width: 40rem;
    color: #667085;
    font-size: 0.98rem;
    line-height: 1.5;
  }

  .message {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;

    .message-content {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      font-size: 0.92rem;
      font-weight: 600;
      line-height: 1.4;
    }

    .message-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      padding: 0;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: inherit;
      cursor: pointer;

      &:hover {
        background: rgba(255, 255, 255, 0.45);
      }
    }

    &.success {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.28);
      color: #047857;
    }

    &.error {
      background: rgba(185, 28, 28, 0.08);
      border: 1px solid rgba(185, 28, 28, 0.28);
      color: #b91c1c;
    }
  }

  .main-content {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 20px;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    background: #ffffff;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    h2 {
      margin: 0;
      color: #1c1c1c;
      font-size: 1.05rem;
      font-weight: 700;
      line-height: 1.3;
    }

    p {
      margin: 4px 0 0;
      color: #667085;
      font-size: 0.9rem;
      line-height: 1.45;
    }
  }

  .section-icon,
  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 12px;
    background: rgba(98, 150, 211, 0.12);
    color: #3969a0;
  }

  .export-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .export-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin: 0;
    padding: 14px;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;
    cursor: pointer;

    &:hover:not(.no-data) {
      border-color: rgba(98, 150, 211, 0.55);
      background: #f7fafd;
    }

    &.selected {
      border-color: #6296d3;
      background: rgba(98, 150, 211, 0.06);
    }

    &.no-data {
      cursor: default;
      background: #fafbfc;
    }

    input {
      position: absolute;
      width: 18px;
      height: 18px;
      margin: 2px 0 0;
      opacity: 0;
    }

    .checkmark {
      position: relative;
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      margin-top: 2px;
      border: 1.5px solid #d0d5dd;
      border-radius: 6px;
      background: #ffffff;

      &::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 5px;
        width: 4px;
        height: 8px;
        border: solid #ffffff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        opacity: 0;
      }
    }

    input:checked + .checkmark {
      border-color: #6296d3;
      background: #6296d3;

      &::after {
        opacity: 1;
      }
    }

    input:focus-visible + .checkmark {
      outline: 2px solid #6296d3;
      outline-offset: 2px;
    }

    input:disabled + .checkmark {
      background: #f3f4f6;
      border-color: #e6e8ec;
    }

    .export-item-content {
      flex: 1;
      min-width: 0;
    }

    .export-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #3969a0;

      h3 {
        margin: 0;
        color: #1c1c1c;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.3;
      }
    }

    .no-data-badge {
      margin-left: auto;
      padding: 3px 8px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #667085;
      font-size: 0.72rem;
      font-weight: 700;
    }

    p {
      margin: 4px 0 0;
      color: #667085;
      font-size: 0.86rem;
      line-height: 1.45;
    }

    .data-preview {
      margin-top: 6px;
      color: #98a2b3;
      font-size: 0.8rem;
      font-weight: 600;
    }
  }

  .export-btn,
  .preview-btn,
  .merge-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 12px;
    background: #6296d3;
    color: #ffffff;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #3969a0;
    }

    &:disabled {
      background: #e6e8ec;
      color: #98a2b3;
      cursor: not-allowed;
    }
  }

  .export-btn {
    height: 44px;
    width: 100%;
  }

  .import-area {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .file-input {
    display: none;
  }

  .file-label {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 88px;
    padding: 16px;
    border: 1px dashed #d0d5dd;
    border-radius: 12px;
    background: #fafbfc;
    cursor: pointer;

    &:hover {
      border-color: #6296d3;
      background: #f7fafd;
    }
  }

  .file-label-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .file-label-title {
    color: #1c1c1c;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .file-label-subtitle {
    color: #667085;
    font-size: 0.86rem;
    line-height: 1.4;
  }

  .file-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;

    .file-details {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      color: #3969a0;
    }

    .file-name {
      color: #1c1c1c;
      font-size: 0.92rem;
      font-weight: 700;
      word-break: break-all;
    }

    .file-size {
      color: #667085;
      font-size: 0.8rem;
    }
  }

  .preview-btn {
    height: 36px;
    flex-shrink: 0;
    padding: 0 14px;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(28, 28, 28, 0.4);
  }

  .modal {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 560px;
    max-height: min(80vh, 640px);
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 16px 12px 20px;

    h3 {
      margin: 0;
      color: #1c1c1c;
      font-size: 1.05rem;
      font-weight: 700;
    }
  }

  .modal-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid #e6e8ec;
    border-radius: 8px;
    background: #ffffff;
    color: #667085;
    cursor: pointer;

    &:hover {
      background: #f7fafd;
      color: #1c1c1c;
    }
  }

  .modal-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 20px 20px;
    overflow-y: auto;
  }

  .preview-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: #f7fafd;
  }

  .meta-item {
    color: #667085;
    font-size: 0.86rem;

    strong {
      color: #1c1c1c;
      font-weight: 700;
    }
  }

  .preview-data {
    h4 {
      margin: 0 0 10px;
      color: #1c1c1c;
      font-size: 0.92rem;
      font-weight: 700;
    }
  }

  .preview-item {
    padding: 12px 14px;
    border: 1px solid rgba(98, 150, 211, 0.28);
    border-radius: 12px;
    background: rgba(98, 150, 211, 0.06);

    & + & {
      margin-top: 8px;
    }
  }

  .preview-item-header {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #3969a0;
    font-size: 0.92rem;
    font-weight: 700;

    span {
      color: #1c1c1c;
    }
  }

  .preview-item-details {
    margin-top: 4px;
    color: #667085;
    font-size: 0.84rem;
    line-height: 1.4;
  }

  .import-warning {
    display: flex;
    gap: 10px;
    padding: 12px 14px;
    border: 1px solid rgba(251, 191, 36, 0.35);
    border-radius: 12px;
    background: rgba(251, 191, 36, 0.12);
    color: #b45309;

    svg {
      flex-shrink: 0;
      margin-top: 1px;
    }

    strong {
      color: #92400e;
    }

    p {
      margin: 4px 0 0;
      color: #92400e;
      font-size: 0.84rem;
      line-height: 1.45;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid #e6e8ec;

    button {
      height: 40px;
      padding: 0 14px;
    }
  }

  .cancel-btn,
  .replace-btn {
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    background: #ffffff;
    color: #1c1c1c;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #f7fafd;
    }

    &:disabled {
      color: #98a2b3;
      cursor: not-allowed;
    }
  }

  .replace-btn {
    border-color: rgba(185, 28, 28, 0.35);
    color: #b91c1c;

    &:hover:not(:disabled) {
      background: rgba(185, 28, 28, 0.06);
    }
  }

  @media (max-width: 900px) {
    .main-content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .file-info {
      flex-direction: column;
      align-items: stretch;
    }

    .preview-btn {
      width: 100%;
    }

    .modal-actions {
      flex-direction: column-reverse;

      button {
        width: 100%;
      }
    }
  }
`;
