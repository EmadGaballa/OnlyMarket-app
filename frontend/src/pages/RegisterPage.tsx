import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import PasswordRequirements, {
  isPasswordValid,
} from "../components/PasswordRequirements";
import styles from "./RegisterPage.module.css";

/**
 * Parses raw API errors (including stringified JSON error objects)
 * and returns user-friendly error text.
 */
function getFriendlyRegisterError(err: unknown): string {
  if (!err) return "Registration failed. Please try again.";

  let rawMessage = "";
  let status: number | undefined;
  let errorCode: string | undefined;

  // 1. Extract raw error info if wrapped in Error or custom object
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

  // 2. Parse stringified JSON if client.ts threw full response string
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
    status === 409 ||
    errorCode === "DUPLICATE_RESOURCE" ||
    /already exists/i.test(rawMessage)
  ) {
    return "An account with this email address already exists. Try signing in instead.";
  }

  if (
    status === 400 ||
    errorCode === "BAD_REQUEST" ||
    /password/i.test(rawMessage)
  ) {
    return "Please check your information and ensure it meets all requirements.";
  }

  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // 4. Return clean raw message if it's already user-readable, otherwise generic fallback
  if (rawMessage && !rawMessage.includes("{") && !rawMessage.includes("http")) {
    return rawMessage;
  }

  return "Registration failed. Please check your details and try again.";
}

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordValid = isPasswordValid(password);
  const passwordsMatch =
    confirmPassword.length > 0 && confirmPassword === password;
  const canSubmit =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    email.trim() !== "" &&
    passwordValid &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!passwordValid) {
      setError("Password does not meet the required policy.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(email, password, firstName, lastName);
      navigate("/");
    } catch (err) {
      // Clean up the error message before presenting to the user
      setError(getFriendlyRegisterError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.headerGroup}>
          <h1>Create an Account</h1>
          <p className={styles.subtitle}>
            Join us today to get started with your orders
          </p>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <div className={styles.inputWrapper}>
                <UserIcon className={styles.inputIcon} />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  autoComplete="given-name"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <div className={styles.inputWrapper}>
                <UserIcon className={styles.inputIcon} />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  autoComplete="family-name"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

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
            <label htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
            <PasswordRequirements password={password} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className={styles.fieldError} role="alert">
                Passwords do not match.
              </p>
            )}
          </div>

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className={styles.spinner} />
                <span>Creating Account...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className={styles.formFooter}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

/* Accessible Inline SVG Icons */
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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
