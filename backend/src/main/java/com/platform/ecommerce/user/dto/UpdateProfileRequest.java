package com.platform.ecommerce.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Profile update request payload. */
public record UpdateProfileRequest(
    @Schema(description = "User's first name", example = "John")
    @NotBlank(message = "First name is required")
    @Size(max = 100)
    String firstName,

    @Schema(description = "User's last name", example = "Doe")
    @NotBlank(message = "Last name is required")
    @Size(max = 100)
    String lastName,

    @Schema(description = "Phone number (optional)", example = "+1-555-0100")
    @Size(max = 30)
    String phone) {}