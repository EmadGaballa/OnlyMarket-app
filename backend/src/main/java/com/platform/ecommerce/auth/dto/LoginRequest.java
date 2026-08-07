package com.platform.ecommerce.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Login request payload. */
public record LoginRequest(
    @Schema(description = "Registered email address", example = "admin@ecommerce.local")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    String email,

    @Schema(description = "Account password", example = "Admin123!")
    @NotBlank(message = "Password is required")
    String password) {}