package com.platform.ecommerce.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

/** Delete-account request payload. Password confirmation is required. */
public record DeleteAccountRequest(
    @Schema(description = "Current password to confirm the deletion", example = "Old!Passw0rd")
    @NotBlank(message = "Current password is required")
    String currentPassword) {}