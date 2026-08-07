package com.platform.ecommerce.user.dto;

import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.user.domain.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/**
 * User profile returned to clients — never the raw entity. Excludes
 * password hash and other sensitive fields.
 */
public record UserResponse(
    @Schema(description = "User id")
    Long id,

    @Schema(description = "Email address", example = "john.doe@example.com")
    String email,

    @Schema(description = "First name", example = "John")
    String firstName,

    @Schema(description = "Last name", example = "Doe")
    String lastName,

    @Schema(description = "Phone number", example = "+1-555-0100")
    String phone,

    @Schema(description = "Avatar URL", example = "/uploads/avatars/abc123.jpg")
    String avatarUrl,

    @Schema(description = "Whether the email is verified", example = "true")
    boolean emailVerified,

    @Schema(description = "Account status", example = "ACTIVE")
    UserStatus status,

    @Schema(description = "Role names", example = "[\"CUSTOMER\"]")
    List<String> roles,

    @Schema(description = "Account creation timestamp")
    Instant createdAt) {

  public static UserResponse from(User user) {
    return new UserResponse(
        user.getId(),
        user.getEmail(),
        user.getFirstName(),
        user.getLastName(),
        user.getPhone(),
        user.getAvatarUrl(),
        user.isEmailVerified(),
        user.getStatus(),
        user.getRoles().stream().map(r -> r.getName()).toList(),
        user.getCreatedAt());
  }
}