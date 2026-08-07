package com.platform.ecommerce.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Reset-password request payload. */
public record ResetPasswordRequest(
    @Schema(description = "One-time reset token from the email", example = "abc123...")
    @NotBlank(message = "Reset token is required")
    String token,

    @Schema(description = "New password (minimum 8 characters)", example = "N3w!Passw0rd")
    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    String newPassword) {}