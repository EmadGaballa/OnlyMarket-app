package com.platform.ecommerce.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Registration request payload.
 *
 * @param firstName user's first name
 * @param lastName user's last name
 * @param email unique email address
 * @param password strong password
 */
public record RegisterRequest(
    @Schema(description = "User's first name", example = "John")
    @NotBlank(message = "First name is required")
    @Size(max = 100)
    String firstName,

    @Schema(description = "User's last name", example = "Doe")
    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    String lastName,

    @Schema(description = "Unique email address", example = "john.doe@example.com")
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255)
    String email,

    @Schema(description = "Password (minimum 8 characters)", example = "S3cure!Passw0rd")
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    String password) {}