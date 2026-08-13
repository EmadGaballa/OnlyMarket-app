import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import styles from "./LoginPage.module.css";

/**
 * Parses raw API errors (including stringified JSON error objects)
 * and returns user-friendly, actionable error text for login.
 */
function getFriendlyLoginError(err: unknown): string {
  if (!err) return "Login failed. Please try again.";

  let rawMessage = "";
  let status: number | undefined;
  let errorCode: string | undefined;

  // 1. Extract raw error information
  if (err instanceof Error) {
    rawMessage = err.message;
  } else if (typeof err === "object" && err !== null) {
    const apiErr = err as Record<string, any>;
    rawMessage = apiErr.message || "";
    status = apiErr.status;
    errorCode = apiErr.error;
  } else if (typeof err === "string") {
    rawMessage = err;
  }

  // 2. Parse stringified JSON if client.ts threw a raw JSON string response
  if (rawMessage.trim().startsWith("{") && rawMessage.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(rawMessage);
      rawMessage = parsed.message || rawMessage;
      status = parsed.status || status;
      errorCode = parsed.error || errorCode;
    } catch {
      // Fall through if JSON parsing fails
    }
  }

  // 3. Map status codes & error keys to clean UI messages
  if (
    status === 401 ||
    errorCode === "UNAUTHORIZED" ||
    errorCode === "INVALID_CREDENTIALS" ||
    /invalid credentials|bad credentials|unauthorized|password/i.test(
      rawMessage,
    )
  ) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (
    status === 404 ||
    errorCode === "USER_NOT_FOUND" ||
    /not found|does not exist/i.test(rawMessage)
  ) {
    return "No account found with this email address. Please check your spelling or register.";
  }

  if (status === 429) {
    return "Too many failed login attempts. Please wait a moment and try again.";
  }

  if (status && status >= 500) {
    return "Our authentication servers are experiencing issues. Please try again shortly.";
  }

  // 4. Fallback for clean non-technical string messages
  if (rawMessage && !rawMessage.includes("{") && !rawMessage.includes("http")) {
    return rawMessage;
  }

  return "Invalid email or password. Please check your details and try again.";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Support post-login redirection if user was intercepted from a protected route
  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getFriendlyLoginError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerGroup}>
          <h1>Welcome Back</h1>
          <p className={styles.subtitle}>
            Sign in to your account to continue shopping
          </p>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <div className={styles.inputWrapper}>
              <EmailIcon className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <div className={styles.labelRow}>
              <label htmlFor="password">Password</label>
              {/* <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link> */}
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className={styles.spinner} />
                <span>Signing in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className={styles.formFooter}>
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

/* Accessible Inline SVG Icons */
function EmailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function SpinnerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
