import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: authApi.me,
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard}>
          <SpinnerIcon className={styles.spinner} />
          <p>Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard} role="alert">
          <AlertIcon className={styles.errorIcon} />
          <h2>Failed to load profile</h2>
          <p>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>
          <button onClick={() => refetch()} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const initials = profile
    ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.avatar} aria-hidden="true">
            <span>{initials || "U"}</span>
          </div>
          <div className={styles.headerInfo}>
            <h1>
              {profile?.firstName} {profile?.lastName}
            </h1>
            <p className={styles.emailText}>{profile?.email}</p>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Profile Information Grid */}
        <div className={styles.fieldsGrid}>
          <div className={styles.profileField}>
            <div className={styles.fieldHeader}>
              <UserIcon className={styles.fieldIcon} />
              <span className={styles.label}>Full Name</span>
            </div>
            <p className={styles.value}>
              {profile?.firstName} {profile?.lastName}
            </p>
          </div>

          <div className={styles.profileField}>
            <div className={styles.fieldHeader}>
              <EmailIcon className={styles.fieldIcon} />
              <span className={styles.label}>Email Address</span>
            </div>
            <p className={styles.value}>{profile?.email}</p>
          </div>

          <div className={styles.profileField}>
            <div className={styles.fieldHeader}>
              <PhoneIcon className={styles.fieldIcon} />
              <span className={styles.label}>Phone Number</span>
            </div>
            <p className={styles.value}>
              {profile?.phone ? (
                profile.phone
              ) : (
                <span className={styles.notSet}>Not set</span>
              )}
            </p>
          </div>

          <div className={styles.profileField}>
            <div className={styles.fieldHeader}>
              <BadgeIcon className={styles.fieldIcon} />
              <span className={styles.label}>Account Status</span>
            </div>
            <div className={styles.value}>
              <span
                className={`${styles.statusBadge} ${profile?.status === "ACTIVE" ? styles.active : ""}`}
              >
                {profile?.status || "Active"}
              </span>
            </div>
          </div>

          <div className={styles.profileField}>
            <div className={styles.fieldHeader}>
              <ShieldIcon className={styles.fieldIcon} />
              <span className={styles.label}>Roles</span>
            </div>
            <div className={styles.rolesList}>
              {profile?.roles && profile.roles.length > 0 ? (
                profile.roles.map((role) => (
                  <span key={role} className={styles.roleBadge}>
                    {role}
                  </span>
                ))
              ) : (
                <span className={styles.roleBadge}>User</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Inline SVG Icons for Visual Consistency & Accessibility */
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

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function BadgeIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
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
      width="28"
      height="28"
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
