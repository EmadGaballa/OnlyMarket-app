package com.platform.ecommerce.common.validation;

import java.util.ArrayList;
import java.util.List;

/**
 * Central password policy for the platform.
 *
 * <p>Rules:</p>
 * <ul>
 *   <li>at least 8 characters</li>
 *   <li>at least one uppercase letter</li>
 *   <li>at least one lowercase letter</li>
 *   <li>at least one digit</li>
 *   <li>at least one special (non-alphanumeric) character</li>
 * </ul>
 *
 * <p>Used both by the {@code @ValidPassword} bean-validation constraint and by
 * service-layer checks that need to enforce the policy on values that are not
 * part of a validated request body. Returns {@code null} when the password is
 * valid, otherwise a human-readable message listing every rule that failed so
 * the API error is actionable for the caller.</p>
 */
public final class PasswordPolicy {

  private PasswordPolicy() {
  }

  /**
   * Validate a password against the platform policy.
   *
   * @param password the plain-text password to validate (may be {@code null})
   * @return {@code null} if the password satisfies every rule, otherwise a
   *     message describing each failed rule
   */
  public static String validate(String password) {
    if (password == null) {
      return "Password is required";
    }

    List<String> failures = new ArrayList<>();
    if (password.length() < 8) {
      failures.add("at least 8 characters");
    }
    if (!containsUppercase(password)) {
      failures.add("one uppercase letter");
    }
    if (!containsLowercase(password)) {
      failures.add("one lowercase letter");
    }
    if (!containsDigit(password)) {
      failures.add("one digit");
    }
    if (!containsSpecial(password)) {
      failures.add("one special character");
    }

    if (failures.isEmpty()) {
      return null;
    }
    return "Password must contain " + String.join(", ", failures) + ".";
  }

  private static boolean containsUppercase(String value) {
    return value.chars().anyMatch(ch -> ch >= 'A' && ch <= 'Z');
  }

  private static boolean containsLowercase(String value) {
    return value.chars().anyMatch(ch -> ch >= 'a' && ch <= 'z');
  }

  private static boolean containsDigit(String value) {
    return value.chars().anyMatch(Character::isDigit);
  }

  /** A "special" character is any non-alphanumeric character. */
  private static boolean containsSpecial(String value) {
    return value.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
  }
}