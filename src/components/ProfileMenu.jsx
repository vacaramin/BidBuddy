import { useEffect, useRef, useState } from "preact/hooks";
import styled from "styled-components";
import {
  Check,
  ChevronDown,
  Copy,
  ImagePlus,
  PenLine,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-preact";
import { route } from "preact-router";
import ProfileAvatar from "./ProfileAvatar";
import { Toast, useToast } from "./Toast";
import {
  createProfile,
  deleteProfile,
  getActiveProfile,
  listProfiles,
  loadStore,
  readProfilePhoto,
  renameProfile,
  setActiveProfileId,
  updateProfile,
} from "../utils/profiles";

const ProfileMenu = ({ className }) => {
  const [store, setStore] = useState(() => loadStore());
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const rootRef = useRef(null);
  const photoInputRef = useRef(null);
  const closeTimerRef = useRef(null);
  const { toast, showToast } = useToast();

  const profiles = listProfiles(store);
  const active = getActiveProfile(store);

  const refresh = () => setStore(loadStore());

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener("bidbuddy:profiles-changed", onChange);
    return () =>
      window.removeEventListener("bidbuddy:profiles-changed", onChange);
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuPos(null);
      return undefined;
    }

    const updatePos = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    };

    updatePos();
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        if (dialog) return;
        setOpen(false);
      }
    };
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, dialog]);

  const clearDialogFields = () => {
    setNameDraft("");
    setNameError("");
  };

  const closeDialog = () => {
    setDialogOpen(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setDialog(null);
      clearDialogFields();
      closeTimerRef.current = null;
    }, 200);
  };

  const openDialog = (next) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(false);
    setDialogOpen(false);
    setDialog(next);
  };

  useEffect(() => {
    if (!dialog) return undefined;
    let openFrame;
    const mountFrame = requestAnimationFrame(() => {
      openFrame = requestAnimationFrame(() => setDialogOpen(true));
    });
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(mountFrame);
      if (openFrame) cancelAnimationFrame(openFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dialog?.type]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    },
    [],
  );

  const switchProfile = (id) => {
    if (id === store.activeProfileId) {
      setOpen(false);
      return;
    }
    setStore(setActiveProfileId(store, id));
    setOpen(false);
    showToast("Profile switched");
  };

  const openNew = () => {
    setNameDraft("Profile");
    setNameError("");
    openDialog({ type: "new" });
  };

  const openRename = () => {
    if (!active) return;
    setNameDraft(active.name);
    setNameError("");
    openDialog({ type: "rename" });
  };

  const openDelete = () => {
    if (!active || profiles.length <= 1) {
      showToast("You need at least one profile", "error");
      return;
    }
    openDialog({ type: "delete" });
  };

  const confirmNew = () => {
    const label = nameDraft.trim();
    if (!label) {
      setNameError("Profile name is required");
      return;
    }
    const { store: next, profile } = createProfile(store, { name: label });
    setStore(next);
    closeDialog();
    showToast(`Created ${profile.name}`);
  };

  const confirmRename = () => {
    if (!active) return;
    const { store: next, error } = renameProfile(store, active.id, nameDraft);
    if (error) {
      setNameError(error);
      return;
    }
    setStore(next);
    closeDialog();
    showToast("Profile renamed");
  };

  const confirmDelete = () => {
    if (!active) return;
    const { store: next, error } = deleteProfile(store, active.id);
    if (error) {
      showToast(error, "error");
      closeDialog();
      return;
    }
    setStore(next);
    closeDialog();
    showToast("Profile deleted");
  };

  const handleDuplicate = () => {
    if (!active) return;
    const { store: next, profile } = createProfile(store, {
      cloneFromId: active.id,
    });
    setStore(next);
    setOpen(false);
    showToast(`Duplicated as ${profile.name}`);
  };

  const handlePhotoPick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !active) return;
    try {
      const dataUrl = await readProfilePhoto(file);
      const next = updateProfile(store, active.id, { photo: dataUrl });
      setStore(next);
      setOpen(false);
      showToast("Photo updated");
    } catch (error) {
      showToast(error.message || "Couldn't use that image", "error");
    }
  };

  const clearPhoto = () => {
    if (!active?.photo) return;
    const next = updateProfile(store, active.id, { photo: "" });
    setStore(next);
    setOpen(false);
    showToast("Photo removed");
  };

  return (
    <div className={className} ref={rootRef}>
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handlePhotoPick}
      />
      <button
        type="button"
        className={`menu-trigger${open ? " open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ProfileAvatar photo={active?.photo} name={active?.name} size={32} />
        <span className="trigger-copy">
          <span className="trigger-name">{active?.name || "Profile"}</span>
          {active?.headline ? (
            <span className="trigger-headline">{active.headline}</span>
          ) : null}
        </span>
        <ChevronDown size={16} className="trigger-chevron" aria-hidden="true" />
      </button>

      {open && menuPos && (
        <div
          className="menu"
          role="menu"
          aria-label="Profiles"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <div className="menu-heading">
            <ProfileAvatar
              photo={active?.photo}
              name={active?.name}
              size={40}
            />
            <div>
              <strong>{active?.name || "Profile"}</strong>
              {active?.headline ? <span>{active.headline}</span> : null}
            </div>
          </div>

          <div className="menu-section-label">Switch profile</div>
          <ul className="profile-list">
            {profiles.map((profile) => {
              const selected = profile.id === active?.id;
              return (
                <li key={profile.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    className={`profile-item${selected ? " active" : ""}`}
                    onClick={() => switchProfile(profile.id)}
                  >
                    <ProfileAvatar
                      photo={profile.photo}
                      name={profile.name}
                      size={28}
                    />
                    <span className="profile-item-copy">
                      <span>{profile.name}</span>
                      {profile.headline ? (
                        <small>{profile.headline}</small>
                      ) : null}
                    </span>
                    {selected ? (
                      <Check size={16} className="check" aria-hidden="true" />
                    ) : (
                      <span className="check-spacer" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="menu-action"
            onClick={openNew}
          >
            <Plus size={16} />
            Add profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-action"
            onClick={() => photoInputRef.current?.click()}
          >
            <ImagePlus size={16} />
            {active?.photo ? "Change photo" : "Add photo"}
          </button>
          {active?.photo ? (
            <button
              type="button"
              role="menuitem"
              className="menu-action"
              onClick={clearPhoto}
            >
              <Trash2 size={16} />
              Remove photo
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="menu-action"
            onClick={handleDuplicate}
          >
            <Copy size={16} />
            Duplicate profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-action"
            onClick={openRename}
          >
            <PenLine size={16} />
            Rename profile
          </button>
          <button
            type="button"
            role="menuitem"
            className="menu-action danger"
            onClick={openDelete}
            disabled={profiles.length <= 1}
          >
            <Trash2 size={16} />
            Delete profile
          </button>

          <div className="menu-divider" />

          <button
            type="button"
            role="menuitem"
            className="menu-action"
            onClick={() => {
              setOpen(false);
              route("/settings");
            }}
          >
            <Settings size={16} />
            Profile setup
          </button>
        </div>
      )}

      {dialog && (
        <div
          className={`modal-overlay${dialogOpen ? " open" : ""}`}
          onClick={closeDialog}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-menu-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            {(dialog.type === "new" || dialog.type === "rename") && (
              <>
                <div className="modal-header">
                  <h2 id="profile-menu-dialog-title">
                    {dialog.type === "new" ? "Add profile" : "Rename profile"}
                  </h2>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={closeDialog}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <label className="field" htmlFor="profile-menu-name">
                  <span>Profile name</span>
                  <input
                    id="profile-menu-name"
                    type="text"
                    value={nameDraft}
                    autoFocus
                    onInput={(event) => {
                      setNameDraft(event.target.value);
                      if (nameError) setNameError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (dialog.type === "new") confirmNew();
                        else confirmRename();
                      }
                    }}
                  />
                </label>
                {nameError && <p className="field-error">{nameError}</p>}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={dialog.type === "new" ? confirmNew : confirmRename}
                  >
                    {dialog.type === "new" ? "Create profile" : "Save name"}
                  </button>
                </div>
              </>
            )}

            {dialog.type === "delete" && (
              <>
                <div className="modal-header">
                  <h2 id="profile-menu-dialog-title">Delete profile</h2>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={closeDialog}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="modal-copy">
                  Delete “{active?.name}”? Proposals that used it stay in
                  history.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={closeDialog}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={confirmDelete}
                  >
                    Delete profile
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
};

export default styled(ProfileMenu)`
  position: relative;
  flex-shrink: 0;

  .menu-trigger {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    max-width: min(280px, 46vw);
    min-height: 44px;
    padding: 6px 10px 6px 6px;
    border: 1px solid #e6e8ec;
    border-radius: 999px;
    background: #ffffff;
    color: #1c1c1c;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;

    &:hover,
    &.open {
      background: #f7fafd;
      border-color: #d0d5dd;
    }
  }

  .profile-avatar {
    flex-shrink: 0;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #e6e8ec;
    background: rgba(98, 150, 211, 0.12);
    color: #3969a0;
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .trigger-copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    text-align: left;
  }

  .trigger-name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .trigger-headline {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #667085;
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.2;
  }

  .trigger-chevron {
    flex-shrink: 0;
    color: #667085;
    transition: transform 0.15s ease;
  }

  .menu-trigger.open .trigger-chevron {
    transform: rotate(180deg);
  }

  .menu {
    position: fixed;
    z-index: 1200;
    width: min(320px, calc(100vw - 24px));
    padding: 8px;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
    animation: profileMenuIn 0.16s ease;
  }

  @keyframes profileMenuIn {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .menu-heading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 10px 12px;
    border-bottom: 1px solid #e6e8ec;
    margin-bottom: 6px;

    strong {
      display: block;
      color: #1c1c1c;
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.25;
    }

    span {
      display: block;
      margin-top: 2px;
      color: #667085;
      font-size: 0.8rem;
      line-height: 1.3;
    }
  }

  .menu-section-label {
    padding: 8px 10px 4px;
    color: #667085;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .profile-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 220px;
    overflow: auto;
  }

  .profile-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #1c1c1c;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: #f7fafd;
    }

    &.active {
      background: rgba(98, 150, 211, 0.1);
    }
  }

  .profile-item-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
      font-weight: 600;
    }

    small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #667085;
      font-size: 0.75rem;
    }
  }

  .check,
  .check-spacer {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #3969a0;
  }

  .menu-divider {
    height: 1px;
    margin: 6px 4px;
    background: #e6e8ec;
  }

  .menu-action {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #1c1c1c;
    font-size: 0.9rem;
    font-weight: 600;
    text-align: left;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: #f7fafd;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &.danger {
      color: #b91c1c;
    }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1300;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(28, 28, 28, 0.4);
    opacity: 0;
    transition: opacity 0.2s ease;
    box-sizing: border-box;

    &,
    & * {
      box-sizing: border-box;
    }

    &.open {
      opacity: 1;

      .modal {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  }

  .modal {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: min(420px, 100%);
    max-width: 100%;
    min-width: 0;
    padding: 16px;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
    opacity: 0;
    transform: translateY(8px) scale(0.98);
    overflow: hidden;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;

    h2 {
      margin: 0;
      min-width: 0;
      flex: 1;
      color: #1c1c1c;
      font-size: 1.02rem;
      font-weight: 700;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
  }

  .modal-copy {
    margin: 0;
    min-width: 0;
    color: #667085;
    font-size: 0.95rem;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;

    span {
      color: #1c1c1c;
      font-size: 0.88rem;
      font-weight: 700;
    }

    input {
      display: block;
      width: 100%;
      max-width: 100%;
      min-width: 0;
      padding: 12px 14px;
      border: 1px solid #e6e8ec;
      border-radius: 12px;
      background: #ffffff;
      color: #1c1c1c;
      font: inherit;
      font-size: 0.95rem;

      &:focus {
        outline: none;
        border-color: #6296d3;
      }
    }
  }

  .field-error {
    margin: 0;
    color: #b91c1c;
    font-size: 0.8rem;
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .modal-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
  }

  .primary-btn,
  .ghost-btn,
  .danger-btn,
  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
  }

  .primary-btn,
  .ghost-btn,
  .danger-btn {
    height: 36px;
    padding: 0 14px;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .primary-btn {
    border: none;
    background: #6296d3;
    color: #ffffff;

    &:hover {
      background: #3969a0;
    }
  }

  .ghost-btn {
    border: 1px solid #e6e8ec;
    background: #ffffff;
    color: #1c1c1c;

    &:hover {
      background: #f7fafd;
    }
  }

  .danger-btn {
    border: none;
    background: #b91c1c;
    color: #ffffff;

    &:hover {
      background: #991b1b;
    }
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid #e6e8ec;
    border-radius: 8px;
    background: #ffffff;
    color: #667085;

    &:hover {
      background: #f7fafd;
      color: #1c1c1c;
    }
  }

  @media (max-width: 640px) {
    .trigger-copy {
      display: none;
    }

    .menu-trigger {
      max-width: none;
      padding: 4px;
      border-radius: 50%;
    }

    .trigger-chevron {
      display: none;
    }
  }
`;
