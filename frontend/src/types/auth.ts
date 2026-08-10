/**
 * Account operational status
 */
export type UserStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "BANNED"
  | "PENDING_VERIFICATION";

/**
 * Standard Role-Based Access Control (RBAC) roles
 */
export type UserRole =
  | "ROLE_USER"
  | "ROLE_ADMIN"
  | "ROLE_MANAGER"
  | "ROLE_SUPPORT"
  | (string & {});

/**
 * Core User profile entity
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  status: UserStatus;
  roles: UserRole[];
  createdAt: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Authentication Request & Response Payloads                                */
/* -------------------------------------------------------------------------- */

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string; // e.g. "Bearer"
  expiresIn?: number; // Seconds until expiration
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*  Address Entities & DTOs                                                   */
/* -------------------------------------------------------------------------- */

export type AddressLabel =
  | "HOME"
  | "WORK"
  | "BILLING"
  | "SHIPPING"
  | (string & {});

/**
 * Full shipping or billing address entity saved to a user profile
 */
export interface Address {
  id: number;
  userId?: number;
  label: AddressLabel;
  recipientName?: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isBillingDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input DTO for creating or updating an address.
 * Automatically stays synchronized with the Address entity structure.
 */
export type AddressRequest = Omit<
  Address,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

/* -------------------------------------------------------------------------- */
/*  Client Auth State (Context / Redux / Zustand)                             */
/* -------------------------------------------------------------------------- */

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
