import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { usersApi } from "../api/users";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PasswordInput from "../components/PasswordInput";
import PasswordRequirements, { isPasswordValid } from "../components/PasswordRequirements";
import ConfirmModal from "../components/ConfirmModal";
import { getApiErrorMessage } from "../utils/cartCache";
import styles from "./AccountSettingsPage.module.css";

interface ApiErrorDetail {
  message: string;
  cooldown: boolean;
}

/** Parses the ApiErrorResponse envelope thrown by the API client. */
function parseApiError(error: unknown, fallback: string): ApiErrorDetail {
  const message = getApiErrorMessage(error, fallback);
  let cooldown = false;
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { status?: number };
      cooldown = parsed.status === 409;
    } catch {
      // Not JSON — leave cooldown false.
    }
  }
  return { message, cooldown };
}

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<ApiErrorDetail | null>(null);

  const newPasswordValid = isPasswordValid(newPassword);
  const newPasswordsMatch = confirmNewPassword.length > 0 && confirmNewPassword === newPassword;
  const passwordSubmittable = currentPassword.length > 0 && newPasswordValid && newPasswordsMatch;

  const changePasswordMutation = useMutation({
    mutationFn: () => usersApi.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordError(null);
      showToast({ type: "success", message: "Password updated successfully." });
    },
    onError: (error) => {
      const detail = parseApiError(error, "Failed to change password.");
      setPasswordError(detail);
      showToast({ type: "error", message: detail.message });
    },
  });

  const [fullName, setFullName] = useState(
    user ? `${user.firstName} ${user.lastName}`.trim() : "",
  );
  const [nameError, setNameError] = useState<ApiErrorDetail | null>(null);

  const changeNameMutation = useMutation({
    mutationFn: () => usersApi.changeName(fullName),
    onSuccess: () => {
      setNameError(null);
      showToast({ type: "success", message: "Full name updated successfully." });
    },
    onError: (error) => {
      const detail = parseApiError(error, "Failed to change your name.");
      setNameError(detail);
      showToast({ type: "error", message: detail.message });
    },
  });

  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<ApiErrorDetail | null>(null);

  const changeEmailMutation = useMutation({
    mutationFn: () => usersApi.changeEmail({ newEmail, currentPassword: emailPassword }),
    onSuccess: () => {
      setNewEmail("");
      setEmailPassword("");
      setEmailError(null);
      showToast({ type: "success", message: "Email updated successfully." });
    },
    onError: (error) => {
      const detail = parseApiError(error, "Failed to change your email.");
      setEmailError(detail);
      showToast({ type: "error", message: detail.message });
    },
  });

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteAccountMutation = useMutation({
    mutationFn: () => usersApi.deleteAccount(deletePassword),
    onSuccess: () => {
      showToast({ type: "success", message: "Your account has been deleted." });
      logout();
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      setDeleteConfirmOpen(false);
      setDeleteError(getApiErrorMessage(error, "Failed to delete your account."));
      showToast({ type: "error", message: getApiErrorMessage(error, "Failed to delete your account.") });
    },
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={styles.page}>
      <header className={styles.headerGroup}>
        <h1>Account Settings</h1>
        <p className={styles.subtitle}>Manage your password, name, email and account security.</p>
      </header>

      <div className={styles.section}>
        <h2>Change Password</h2>
        <p className={styles.hint}>You can change your password once every 24 hours.</p>
        <div className={styles.formGroup}>
          <label htmlFor="currentPassword">Current password</label>
          <PasswordInput
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="newPassword">New password</label>
          <PasswordInput
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter a new password"
            autoComplete="new-password"
          />
          <PasswordRequirements password={newPassword} />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="confirmNewPassword">Confirm new password</label>
          <PasswordInput
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="Re-enter the new password"
            autoComplete="new-password"
          />
          {confirmNewPassword.length > 0 && !newPasswordsMatch && (
            <p className={styles.fieldError} role="alert">Passwords do not match.</p>
          )}
        </div>
        {passwordError && (
          <p className={styles.fieldError} role="alert">{passwordError.message}</p>
        )}
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => changePasswordMutation.mutate()}
          disabled={!passwordSubmittable || changePasswordMutation.isPending || passwordError?.cooldown}
        >
          {changePasswordMutation.isPending ? "Saving..." : "Update Password"}
        </button>
      </div>

      <div className={styles.section}>
        <h2>Change Full Name</h2>
        <p className={styles.hint}>You can change your name once every 30 days.</p>
        <div className={styles.formGroup}>
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John A. Doe"
            autoComplete="name"
            className={styles.textInput}
          />
        </div>
        {nameError && (
          <p className={styles.fieldError} role="alert">{nameError.message}</p>
        )}
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => changeNameMutation.mutate()}
          disabled={fullName.trim().length === 0 || changeNameMutation.isPending || nameError?.cooldown}
        >
          {changeNameMutation.isPending ? "Saving..." : "Update Name"}
        </button>
      </div>

      <div className={styles.section}>
        <h2>Change Email</h2>
        <p className={styles.hint}>You can change your email once every 30 days.</p>
        <div className={styles.formGroup}>
          <label htmlFor="newEmail">New email</label>
          <input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new.email@example.com"
            autoComplete="email"
            className={styles.textInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="emailCurrentPassword">Current password</label>
          <PasswordInput
            id="emailCurrentPassword"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            placeholder="Re-enter your current password"
            autoComplete="current-password"
          />
        </div>
        {emailError && (
          <p className={styles.fieldError} role="alert">{emailError.message}</p>
        )}
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => changeEmailMutation.mutate()}
          disabled={
            !newEmail.trim() || !emailPassword || changeEmailMutation.isPending || emailError?.cooldown
          }
        >
          {changeEmailMutation.isPending ? "Saving..." : "Update Email"}
        </button>
      </div>

      <div className={styles.section}>
        <h2>Session</h2>
        <p className={styles.hint}>Log out of your account on this device.</p>
        <button type="button" className={styles.btnSecondary} onClick={handleLogout}>
          Log Out
        </button>
      </div>

      <div className={`${styles.section} ${styles.dangerZone}`}>
        <h2>Delete Account</h2>
        <p className={styles.hint}>Permanently delete your account. This cannot be undone.</p>
        <div className={styles.formGroup}>
          <label htmlFor="deletePassword">Current password</label>
          <PasswordInput
            id="deletePassword"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
        </div>
        {deleteError && (
          <p className={styles.fieldError} role="alert">{deleteError}</p>
        )}
        <button
          type="button"
          className={styles.btnDanger}
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={!deletePassword}
        >
          Delete my account
        </button>
      </div>

      {deleteConfirmOpen && (
        <ConfirmModal
          message="This will permanently delete your account. Are you sure?"
          confirmLabel="Yes, delete my account"
          cancelLabel="No, keep my account"
          loading={deleteAccountMutation.isPending}
          onConfirm={() => deleteAccountMutation.mutate()}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}