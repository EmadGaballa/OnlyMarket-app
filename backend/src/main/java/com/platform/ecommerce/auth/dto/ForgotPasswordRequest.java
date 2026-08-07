package com.platform.ecommerce.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Forgot-password request payload. */
public record ForgotPasswordRequest(
    @Schema(description = "Registered email address", example = "john.doe@example.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email) {}