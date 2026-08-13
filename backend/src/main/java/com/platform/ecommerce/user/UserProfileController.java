package com.platform.ecommerce.user;

import com.platform.ecommerce.user.dto.AddressRequest;
import com.platform.ecommerce.user.dto.AddressResponse;
import com.platform.ecommerce.user.dto.ChangeEmailRequest;
import com.platform.ecommerce.user.dto.ChangeNameRequest;
import com.platform.ecommerce.user.dto.ChangePasswordRequest;
import com.platform.ecommerce.user.dto.DeleteAccountRequest;
import com.platform.ecommerce.user.dto.UpdateProfileRequest;
import com.platform.ecommerce.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * User self-service endpoints. All routes are ownership-scoped to the
 * authenticated user — a user can only ever read/update their own
 * profile and addresses.
 */
@RestController
@RequestMapping("/api/v1/users/me")
@Tag(name = "User Profile")
public class UserProfileController {

  private final UserProfileService userProfileService;

  public UserProfileController(UserProfileService userProfileService) {
    this.userProfileService = userProfileService;
  }

  @GetMapping
  @Operation(summary = "Get current user profile")
  public ResponseEntity<UserResponse> getMe(Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(UserResponse.from(userProfileService.getUser(userId)));
  }

  @PutMapping
  @Operation(summary = "Update current user profile")
  public ResponseEntity<UserResponse> updateMe(
      @Valid @RequestBody UpdateProfileRequest request,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(UserResponse.from(userProfileService.updateProfile(userId, request)));
  }

  @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload profile avatar")
  public ResponseEntity<Map<String, String>> uploadAvatar(
      @RequestPart("file") MultipartFile file,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    String url = userProfileService.uploadAvatar(userId, file);
    return ResponseEntity.ok(Map.of("avatarUrl", url));
  }

  @GetMapping("/addresses")
  @Operation(summary = "List current user's addresses")
  public ResponseEntity<List<AddressResponse>> listAddresses(Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(userProfileService.listAddresses(userId));
  }

  @PostMapping("/addresses")
  @Operation(summary = "Create a new address")
  public ResponseEntity<AddressResponse> createAddress(
      @Valid @RequestBody AddressRequest request,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(userProfileService.createAddress(userId, request));
  }

  @PutMapping("/addresses/{addressId}")
  @Operation(summary = "Update an address")
  public ResponseEntity<AddressResponse> updateAddress(
      @PathVariable Long addressId,
      @Valid @RequestBody AddressRequest request,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(userProfileService.updateAddress(userId, addressId, request));
  }

  @DeleteMapping("/addresses/{addressId}")
  @Operation(summary = "Delete an address")
  public ResponseEntity<Void> deleteAddress(
      @PathVariable Long addressId,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    userProfileService.deleteAddress(userId, addressId);
    return ResponseEntity.noContent().build();
  }

  @PatchMapping("/password")
  @Operation(summary = "Change current user's password")
  public ResponseEntity<UserResponse> changePassword(
      @Valid @RequestBody ChangePasswordRequest request,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(UserResponse.from(userProfileService.changePassword(userId, request)));
  }

  @PatchMapping("/name")
  @Operation(summary = "Change current user's full name")
  public ResponseEntity<UserResponse> changeName(
      @Valid @RequestBody ChangeNameRequest request,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(UserResponse.from(userProfileService.changeFullName(userId, request)));
  }

  @PatchMapping("/email")
  @Operation(summary = "Change current user's email")
  public ResponseEntity<UserResponse> changeEmail(
      @Valid @RequestBody ChangeEmailRequest request,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(UserResponse.from(userProfileService.changeEmail(userId, request)));
  }

  @DeleteMapping
  @Operation(summary = "Delete (soft-delete) current user's account")
  public ResponseEntity<Void> deleteAccount(
      @Valid @RequestBody DeleteAccountRequest request,
      Authentication authentication) {
    Long userId = currentUserId(authentication);
    userProfileService.deleteAccount(userId, request);
    return ResponseEntity.noContent().build();
  }

  private Long currentUserId(Authentication authentication) {
    var principal = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
    return userProfileService.getUserByEmail(principal.getUsername()).getId();
  }
}