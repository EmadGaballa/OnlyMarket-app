package com.platform.ecommerce.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Change-full-name request payload for the authenticated user. */
public record ChangeNameRequest(
    @Schema(description = "New full name", example = "John A. Doe")
    @NotBlank(message = "Full name is required")
    @Size(max = 200, message = "Full name must be at most 200 characters")
    String fullName) {}