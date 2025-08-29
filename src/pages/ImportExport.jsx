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
      label: "Settings & Configuration",
      icon: <Settings size={16} />,
      description: "Personal info, API keys, and prompt settings",
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
        const itemData = getFromStorage(item.storageKey, null);
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
          } else {
            // For settings and analytics, or replace mode, overwrite completely
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
      stats.settings = {
        hasPersonalInfo: !!data.settings.personalInfo?.name,
        hasApiKeys: data.settings.apiKeys?.some((key) => key.apiKey) || false,
        hasPromptSettings: !!data.settings.promptSettings,
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

  return (
    <div className={className}>
      <div className="header-section">
        <h1>Import & Export</h1>
        <p>
          Backup your configurations and data or restore from a previous backup
        </p>
      </div>

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
          <button className="message-close" onClick={clearMessage}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="main-content">
        {/* Export Section */}
        <div className="section export-section">
          <div className="section-header">
            <div className="section-title">
              <Download size={24} />
              <h2>Export Configuration</h2>
            </div>
            <p>Select the data you want to include in your backup file</p>
          </div>

          <div className="export-options">
            {exportItems.map((item) => {
              const itemData = getFromStorage(item.storageKey, null);
              const hasData =
                itemData &&
                (Array.isArray(itemData)
                  ? itemData.length > 0
                  : Object.keys(itemData).length > 0);

              return (
                <div
                  key={item.key}
                  className={`export-item ${!hasData ? "no-data" : ""}`}
                >
                  <label className="export-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedExportItems[item.key] && hasData}
                      onChange={() => handleExportItemToggle(item.key)}
                      disabled={!hasData}
                    />
                    <span className="checkmark"></span>
                  </label>

                  <div className="export-item-content">
                    <div className="export-item-header">
                      {item.icon}
                      <h3>{item.label}</h3>
                      {!hasData && (
                        <span className="no-data-badge">No Data</span>
                      )}
                    </div>
                    <p>{item.description}</p>

                    {hasData && (
                      <div className="data-preview">
                        {item.key === "proposals" &&
                          Array.isArray(itemData) && (
                            <span>{itemData.length} proposals saved</span>
                          )}
                        {item.key === "settings" && itemData && (
                          <span>
                            {itemData.personalInfo?.name
                              ? "Personal info configured"
                              : "No personal info"}
                            {itemData.apiKeys?.some((k) => k.apiKey)
                              ? " • API keys set"
                              : " • No API keys"}
                          </span>
                        )}
                        {item.key === "analytics" && itemData && (
                          <span>Analytics data available</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="export-btn"
            onClick={handleExport}
            disabled={
              Object.values(selectedExportItems).every((v) => !v) || !exportData
            }
          >
            <Download size={20} />
            Export Selected Data
          </button>
        </div>

        {/* Import Section */}
        <div className="section import-section">
          <div className="section-header">
            <div className="section-title">
              <Upload size={24} />
              <h2>Import Configuration</h2>
            </div>
            <p>Restore your data from a previously exported backup file</p>
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
                <FileText size={32} />
                <div className="file-label-text">
                  <span className="file-label-title">Choose backup file</span>
                  <span className="file-label-subtitle">
                    Select a JSON file exported from BidBuddy
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
                  className="preview-btn"
                  onClick={previewImportData}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Preview Import"}
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
                            {stats.settings.hasPersonalInfo
                              ? "✓ Personal info"
                              : "✗ No personal info"}
                            {stats.settings.hasApiKeys
                              ? " • ✓ API keys"
                              : " • ✗ No API keys"}
                            {stats.settings.hasPromptSettings
                              ? " • ✓ Prompt settings"
                              : " • ✗ No prompt settings"}
                          </span>
                        )}
                        {key === "analytics" && stats.analytics && (
                          <span>
                            {stats.analytics.hasData
                              ? "✓ Analytics data available"
                              : "✗ No analytics data"}
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
                className="cancel-btn"
                onClick={() => setShowPreview(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className="merge-btn"
                onClick={() => handleImport(true)}
                disabled={isProcessing}
              >
                {isProcessing ? "Importing..." : "Merge Data"}
              </button>
              <button
                className="replace-btn"
                onClick={() => handleImport(false)}
                disabled={isProcessing}
              >
                {isProcessing ? "Importing..." : "Replace Data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default styled(ImportExport)`
  min-height: calc(100vh - var(--topBarHeight));
  background: #ffffff;
  box-sizing: border-box;

  .header-section {
    margin-bottom: 40px;

    p {
      padding: 0px 20px;
      color: #666;
      margin: 0;
      font-size: 1.1rem;
    }
  }

  .message {
    margin: 0 20px 30px 20px;
    padding: 16px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .message-content {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
    }

    .message-close {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.7;
      padding: 4px;
      border-radius: 4px;
      color: inherit;

      &:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
      }
    }

    &.success {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
    }

    &.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
  }

  .main-content {
    padding: 0 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
      gap: 50px;
    }
  }

  .section {
    background: rgba(0, 0, 0, 0.02);
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 20px;
    padding: 30px;

    .section-header {
      margin-bottom: 30px;
      text-align: center;

      .section-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 12px;

        h2 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
          font-weight: 700;
        }
      }

      p {
        color: #666;
        margin: 0;
        font-size: 1rem;
        padding: 0;
      }
    }
  }

  /* Export Section */
  .export-options {
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .export-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover:not(.no-data) {
      border-color: rgba(98, 150, 211, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    &.no-data {
      opacity: 0.6;
      background: rgba(0, 0, 0, 0.02);
    }

    .export-checkbox {
      position: relative;
      cursor: pointer;
      margin-top: 4px;

      input[type="checkbox"] {
        opacity: 0;
        position: absolute;
        width: 20px;
        height: 20px;
      }

      .checkmark {
        display: block;
        width: 20px;
        height: 20px;
        background: white;
        border: 2px solid rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        transition: all 0.3s ease;
        position: relative;

        &::after {
          content: "✓";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
      }

      input[type="checkbox"]:checked + .checkmark {
        background: #6296d3;
        border-color: #6296d3;

        &::after {
          opacity: 1;
        }
      }

      input[type="checkbox"]:disabled + .checkmark {
        background: rgba(0, 0, 0, 0.1);
        border-color: rgba(0, 0, 0, 0.2);
        cursor: not-allowed;
      }
    }

    .export-item-content {
      flex: 1;

      .export-item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        h3 {
          margin: 0;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .no-data-badge {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
      }

      p {
        color: #666;
        margin: 0 0 8px 0;
        font-size: 0.95rem;
        line-height: 1.4;
      }

      .data-preview {
        color: #888;
        font-size: 0.85rem;
        font-style: italic;
      }
    }
  }

  .export-btn {
    width: 100%;
    padding: 16px 24px;
    background: linear-gradient(135deg, #6296d3 0%, #7bb1f1 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(98, 150, 211, 0.3);
    }

    &:disabled {
      background: rgba(0, 0, 0, 0.1);
      color: rgba(0, 0, 0, 0.4);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }

  /* Import Section */
  .import-area {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .file-upload {
    .file-input {
      display: none;
    }

    .file-label {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 30px;
      background: white;
      border: 3px dashed rgba(0, 0, 0, 0.2);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;

      &:hover {
        border-color: rgba(98, 150, 211, 0.5);
        background: rgba(98, 150, 211, 0.02);
        transform: translateY(-2px);
      }

      .file-label-text {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .file-label-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
        }

        .file-label-subtitle {
          color: #666;
          font-size: 0.95rem;
        }
      }
    }
  }

  .file-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 16px 20px;
    background: rgba(98, 150, 211, 0.1);
    border: 1px solid rgba(98, 150, 211, 0.3);
    border-radius: 12px;

    .file-details {
      display: flex;
      align-items: center;
      gap: 12px;

      .file-name {
        font-weight: 600;
        color: #333;
      }

      .file-size {
        color: #666;
        font-size: 0.9rem;
      }
    }

    .preview-btn {
      padding: 10px 20px;
      background: #6296d3;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        background: #5285c2;
        transform: translateY(-1px);
      }

      &:disabled {
        background: rgba(0, 0, 0, 0.3);
        cursor: not-allowed;
      }
    }
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal {
    background: white;
    border-radius: 16px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    h3 {
      margin: 0;
      color: #333;
      font-size: 1.3rem;
      font-weight: 700;
    }

    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background 0.3s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
      }
    }
  }

  .modal-content {
    padding: 24px;
    overflow-y: auto;
    flex: 1;

    .preview-info {
      margin-bottom: 24px;

      .preview-meta {
        display: flex;
        gap: 24px;
        padding: 16px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;

        .meta-item {
          color: #666;
          font-size: 0.9rem;

          strong {
            color: #333;
          }
        }
      }
    }

    .preview-data {
      margin-bottom: 24px;

      h4 {
        color: #333;
        margin: 0 0 16px 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .preview-item {
        padding: 12px 16px;
        background: rgba(98, 150, 211, 0.05);
        border: 1px solid rgba(98, 150, 211, 0.2);
        border-radius: 8px;
        margin-bottom: 12px;

        .preview-item-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .preview-item-details {
          color: #666;
          font-size: 0.9rem;
        }
      }
    }

    .import-warning {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 8px;
      color: #d97706;

      div {
        flex: 1;

        strong {
          display: block;
          margin-bottom: 8px;
        }

        p {
          margin: 4px 0;
          font-size: 0.9rem;

          strong {
            display: inline;
            margin: 0;
          }
        }
      }
    }
  }

  .modal-actions {
    padding: 20px 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    button {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .cancel-btn {
      background: rgba(0, 0, 0, 0.1);
      color: #333;

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.2);
      }
    }

    .merge-btn {
      background: rgba(16, 185, 129, 0.9);
      color: white;

      &:hover:not(:disabled) {
        background: #10b981;
        transform: translateY(-1px);
      }
    }

    .replace-btn {
      background: rgba(239, 68, 68, 0.9);
      color: white;

      &:hover:not(:disabled) {
        background: #ef4444;
        transform: translateY(-1px);
      }
    }
  }

  @media (max-width: 768px) {
    .main-content {
      padding: 0 15px;
    }

    .section {
      padding: 20px;
    }

    .export-item {
      flex-direction: column;
      gap: 12px;

      .export-checkbox {
        margin-top: 0;
      }
    }

    .file-info {
      flex-direction: column;
      align-items: stretch;
      text-align: center;

      .preview-btn {
        align-self: stretch;
      }
    }

    .modal {
      margin: 20px;
      max-height: calc(100vh - 40px);
    }

    .modal-actions {
      flex-direction: column;

      button {
        width: 100%;
      }
    }

    .preview-meta {
      flex-direction: column !important;
      gap: 12px !important;
    }
  }

  @media (max-width: 480px) {
    .header-section p {
      padding: 0 15px;
    }

    .message {
      margin: 0 15px 20px 15px;
      padding: 12px 16px;

      .message-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }

    .section .section-title {
      flex-direction: column;
      gap: 8px;
    }

    .file-label {
      flex-direction: column !important;
      text-align: center;
      gap: 16px !important;
    }
  }
`;
