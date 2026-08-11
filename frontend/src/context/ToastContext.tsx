import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import styles from "./ToastContext.module.css";

type ToastType = "success" | "error";

/** Optional call-to-action rendered inside a toast. */
export interface ToastAction {
  label: string;
  /** Route to navigate to (rendered as a react-router {@link Link}). */
  to?: string;
  /** Arbitrary handler; takes precedence over {@link to} when both are set. */
  onClick?: () => void;
}

export interface ToastOptions {
  type: ToastType;
  message: string;
  imageUrl?: string | null;
  action?: ToastAction;
  durationMs?: number;
}

interface Toast extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATION_MS = 3000;
const MAX_VISIBLE_TOASTS = 4;

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextId++;
      const toast: Toast = { ...options, id };
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE_TOASTS - 1)), toast]);
      window.setTimeout(() => dismiss(id), options.durationMs ?? DEFAULT_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  const handleAction = (toast: Toast) => {
    toast.action?.onClick?.();
    dismiss(toast.id);
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className={styles.toastStack} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${
              toast.type === "error" ? styles.toastError : styles.toastSuccess
            }`}
          >
            {toast.imageUrl && (
              <img
                src={toast.imageUrl}
                alt=""
                className={styles.thumbnail}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}

            <div className={styles.content}>
              <p className={styles.message}>{toast.message}</p>

              {toast.action?.to ? (
                <Link
                  to={toast.action.to}
                  className={styles.actionLink}
                  onClick={() => dismiss(toast.id)}
                >
                  {toast.action.label}
                </Link>
              ) : toast.action?.onClick ? (
                <button
                  type="button"
                  className={styles.actionLink}
                  onClick={() => handleAction(toast)}
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return context;
}