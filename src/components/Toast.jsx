import { useEffect, useState } from "preact/hooks";
import styled, { keyframes } from "styled-components";

const toastIn = keyframes`
  from {
    transform: translateX(-50%) translateY(8px);
  }
  to {
    transform: translateX(-50%) translateY(0);
  }
`;

export function useToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, tone = "success") => {
    setToast({ id: Date.now(), message, tone });
  };

  return { toast, showToast };
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

const ToastBase = ({ toast, className }) => {
  if (!toast) return null;
  return (
    <div className={`${className} ${toast.tone}`} role="status">
      {toast.message}
    </div>
  );
};

export const Toast = styled(ToastBase)`
  position: fixed;
  z-index: 1200;
  left: 50%;
  bottom: 28px;
  max-width: min(420px, calc(100% - 32px));
  padding: 12px 16px;
  border-radius: 12px;
  background: #ffffff;
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.35);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  font-weight: 600;
  text-align: center;
  transform: translateX(-50%);
  animation: ${toastIn} 0.2s ease;

  &.error {
    color: #b91c1c;
    border-color: rgba(185, 28, 28, 0.28);
  }
`;
