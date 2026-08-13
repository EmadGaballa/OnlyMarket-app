package com.platform.ecommerce.user.dto;

import com.platform.ecommerce.common.validation.ValidPassword;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Change-password request payload for the authenticated user. */
public record ChangePasswordRequest(
    @Schema(description = "Current password for verification", example = "Old!Passw0rd")
    @NotBlank(message = "Current password is required")
    String currentPassword,

    @Schema(description = "New password meeting the platform policy")
    @NotBlank(message = "New password is required")
    @ValidPassword
    @Size(max = 100, message = "Password must be at most 100 characters")
    String newPassword) {}