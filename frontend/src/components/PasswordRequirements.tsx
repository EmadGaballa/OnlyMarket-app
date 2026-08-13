import styles from "./PasswordRequirements.module.css";

interface Rule {
  label: string;
  met: boolean;
}

const RULES: Rule[] = [
  { label: "At least 8 characters", met: false },
  { label: "One uppercase letter", met: false },
  { label: "One lowercase letter", met: false },
  { label: "One number", met: false },
  { label: "One special character", met: false },
];

const evaluate = (password: string): Rule[] => {
  return [
    { ...RULES[0], met: password.length >= 8 },
    { ...RULES[1], met: /[A-Z]/.test(password) },
    { ...RULES[2], met: /[a-z]/.test(password) },
    { ...RULES[3], met: /[0-9]/.test(password) },
    { ...RULES[4], met: /[^A-Za-z0-9]/.test(password) },
  ];
};

/** Returns true when the password satisfies every policy rule. */
export function isPasswordValid(password: string): boolean {
  return evaluate(password).every((rule) => rule.met);
}

/**
 * Live password-strength checklist. Renders each rule with a neutral circle
 * when unmet and a green checkmark when met.
 */
export default function PasswordRequirements({ password }: { password: string }) {
  const rules = evaluate(password ?? "");

  return (
    <ul className={styles.list}>
      {rules.map((rule) => (
        <li
          key={rule.label}
          className={`${styles.item} ${rule.met ? styles.met : ""}`}
        >
          {rule.met ? <CheckIcon /> : <CircleIcon />}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
