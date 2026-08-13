package com.platform.ecommerce.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Change-email request payload. Password re-entry is required as a security
 * check before the email can be changed.
 */
public record ChangeEmailRequest(
    @Schema(description = "New email address", example = "new.email@example.com")
    @NotBlank(message = "New email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255)
    String newEmail,

    @Schema(description = "Current password for verification", example = "Old!Passw0rd")
    @NotBlank(message = "Current password is required")
    String currentPassword) {}