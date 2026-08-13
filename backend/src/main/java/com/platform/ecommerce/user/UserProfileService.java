package com.platform.ecommerce.user;

import com.platform.ecommerce.auth.RefreshTokenService;
import com.platform.ecommerce.common.exception.BadCredentialsException;
import com.platform.ecommerce.common.exception.CooldownException;
import com.platform.ecommerce.common.exception.DuplicateResourceException;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.common.exception.ValidationException;
import com.platform.ecommerce.common.storage.StorageService;
import com.platform.ecommerce.common.validation.PasswordPolicy;
import com.platform.ecommerce.notification.MailService;
import com.platform.ecommerce.user.domain.Address;
import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.user.domain.UserStatus;
import com.platform.ecommerce.user.dto.AddressRequest;
import com.platform.ecommerce.user.dto.AddressResponse;
import com.platform.ecommerce.user.dto.ChangeEmailRequest;
import com.platform.ecommerce.user.dto.ChangeNameRequest;
import com.platform.ecommerce.user.dto.ChangePasswordRequest;
import com.platform.ecommerce.user.dto.DeleteAccountRequest;
import com.platform.ecommerce.user.dto.UpdateProfileRequest;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * User self-service: profile updates, avatar upload, address CRUD and account
 * security operations (change password/name/email, delete account).
 * All methods are ownership-scoped by {@code userId} — a user can only
 * ever touch their own profile/addresses.
 */
@Service
public class UserProfileService {

  private static final Duration PASSWORD_COOLDOWN = Duration.ofHours(24);
  private static final Duration NAME_COOLDOWN = Duration.ofDays(30);
  private static final Duration EMAIL_COOLDOWN = Duration.ofDays(30);

  private final UserRepository userRepository;
  private final AddressRepository addressRepository;
  private final StorageService storageService;
  private final PasswordEncoder passwordEncoder;
  private final RefreshTokenService refreshTokenService;
  private final MailService mailService;

  public UserProfileService(
      UserRepository userRepository,
      AddressRepository addressRepository,
      StorageService storageService,
      PasswordEncoder passwordEncoder,
      RefreshTokenService refreshTokenService,
      MailService mailService) {
    this.userRepository = userRepository;
    this.addressRepository = addressRepository;
    this.storageService = storageService;
    this.passwordEncoder = passwordEncoder;
    this.refreshTokenService = refreshTokenService;
    this.mailService = mailService;
  }

  @Transactional(readOnly = true)
  public User getUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId));
  }

  @Transactional(readOnly = true)
  public User getUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User with email " + email));
  }

  @Transactional
  public User updateProfile(Long userId, UpdateProfileRequest request) {
    User user = getUser(userId);
    user.setFirstName(request.firstName());
    user.setLastName(request.lastName());
    user.setPhone(request.phone());
    return userRepository.save(user);
  }

  @Transactional
  public String uploadAvatar(Long userId, MultipartFile file) {
    User user = getUser(userId);
    try {
      String url = storageService.store(
          "avatars", file.getOriginalFilename(), file.getContentType(), file.getInputStream());
      user.setAvatarUrl(url);
      userRepository.save(user);
      return url;
    } catch (IOException e) {
      throw new IllegalStateException("Failed to read uploaded avatar", e);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Account security                                                          */
  /* ------------------------------------------------------------------------ */

  /**
   * Change the user's password. Enforces a 24-hour cooldown and revokes all
   * other refresh-token sessions so the change is security-preserving.
   */
  @Transactional
  public User changePassword(Long userId, ChangePasswordRequest request) {
    User user = getUser(userId);

    if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
      throw new BadCredentialsException("Current password is incorrect");
    }

    String policyFailure = PasswordPolicy.validate(request.newPassword());
    if (policyFailure != null) {
      throw new ValidationException(policyFailure);
    }

    enforceCooldown(user.getLastPasswordChangeAt(), PASSWORD_COOLDOWN, "password");

    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    user.setLastPasswordChangeAt(LocalDateTime.now());
    User saved = userRepository.save(user);

    // Standard security practice after a password change: log out every other
    // session by revoking all refresh tokens for this user.
    refreshTokenService.revokeAllForUser(userId);

    return saved;
  }

  /**
   * Change the user's full name. Enforces a 30-day cooldown.
   */
  @Transactional
  public User changeFullName(Long userId, ChangeNameRequest request) {
    User user = getUser(userId);
    enforceCooldown(user.getLastNameChangeAt(), NAME_COOLDOWN, "full name");

    String fullName = request.fullName().trim();
    int firstSpace = fullName.indexOf(' ');
    if (firstSpace <= 0) {
      throw new ValidationException("Full name must include a first and last name");
    }
    user.setFirstName(fullName.substring(0, firstSpace).trim());
    user.setLastName(fullName.substring(firstSpace + 1).trim());
    user.setLastNameChangeAt(LocalDateTime.now());
    return userRepository.save(user);
  }

  /**
   * Change the user's email. Verifies the current password, enforces a 30-day
   * cooldown and checks uniqueness against the existing registration check.
   *
   * <p>Because {@link MailService} only logs to the console in v1 (no real
   * delivery), the change is applied immediately and a "confirmation" email is
   * logged. A production system would instead email a verification link and
   * only apply the change once the link is clicked.
   */
  @Transactional
  public User changeEmail(Long userId, ChangeEmailRequest request) {
    User user = getUser(userId);

    if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
      throw new BadCredentialsException("Current password is incorrect");
    }

    enforceCooldown(user.getLastEmailChangeAt(), EMAIL_COOLDOWN, "email");

    String newEmail = request.newEmail().toLowerCase();
    if (userRepository.existsByEmail(newEmail)) {
      throw new DuplicateResourceException("User", "email", newEmail);
    }

    user.setEmail(newEmail);
    user.setEmailVerified(false); // reset verification for the new address
    user.setLastEmailChangeAt(LocalDateTime.now());
    User saved = userRepository.save(user);

    mailService.send(saved.getEmail(), "Your email address was changed",
        "<p>Your email address was changed on your account.</p>");

    return saved;
  }

  /**
   * Soft-delete the user's account: verify the current password, flip the
   * status to {@link UserStatus#DELETED} and revoke every refresh-token
   * session. A soft delete preserves order-history integrity instead of
   * removing the row.
   */
  @Transactional
  public void deleteAccount(Long userId, DeleteAccountRequest request) {
    User user = getUser(userId);

    if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
      throw new BadCredentialsException("Current password is incorrect");
    }

    user.setStatus(UserStatus.DELETED);
    // Keep the email for uniqueness constraints; clear PII that is not needed
    // for order history.
    user.setPhone(null);
    user.setAvatarUrl(null);
    userRepository.save(user);

    refreshTokenService.revokeAllForUser(userId);
  }

  /**
   * Reject the change if the last change happened less than {@code cooldown}
   * ago, with a human-readable "try again in Xh Ym" message.
   */
  private void enforceCooldown(LocalDateTime lastChange, Duration cooldown, String action) {
    if (lastChange == null) {
      return; // never changed — always allowed
    }
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime nextAllowed = lastChange.plus(cooldown);
    if (now.isBefore(nextAllowed)) {
      Duration remaining = Duration.between(now, nextAllowed);
      long hours = remaining.toHours();
      long minutes = remaining.toMinutes() % 60;
      throw new CooldownException(
          "You can change your " + action + " again in " + hours + "h " + minutes + "m.");
    }
  }

  @Transactional(readOnly = true)
  public List<AddressResponse> listAddresses(Long userId) {
    return addressRepository.findByUserIdOrderByDefaultAddressDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public AddressResponse createAddress(Long userId, AddressRequest request) {
    User user = getUser(userId);
    Address address = new Address();
    address.setUser(user);
    applyRequest(address, request);

    if (request.isDefault()) {
      clearDefaultFlag(userId);
    } else if (addressRepository.findByUserIdOrderByDefaultAddressDesc(userId).isEmpty()) {
      address.setDefaultAddress(true);
    }

    return toResponse(addressRepository.save(address));
  }

  @Transactional
  public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
    Address address = addressRepository.findByIdAndUserId(addressId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
    applyRequest(address, request);

    if (request.isDefault()) {
      clearDefaultFlag(userId);
      address.setDefaultAddress(true);
    }

    return toResponse(addressRepository.save(address));
  }

  @Transactional
  public void deleteAddress(Long userId, Long addressId) {
    Address address = addressRepository.findByIdAndUserId(addressId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
    addressRepository.delete(address);
  }

  private void applyRequest(Address address, AddressRequest request) {
    address.setLabel(request.label());
    address.setLine1(request.line1());
    address.setLine2(request.line2());
    address.setCity(request.city());
    address.setState(request.state());
    address.setPostalCode(request.postalCode());
    address.setCountry(request.country());
    address.setDefaultAddress(request.isDefault());
  }

  private void clearDefaultFlag(Long userId) {
    addressRepository.findByUserIdOrderByDefaultAddressDesc(userId)
        .forEach(a -> {
          if (a.isDefaultAddress()) {
            a.setDefaultAddress(false);
            addressRepository.save(a);
          }
        });
  }

  private AddressResponse toResponse(Address a) {
    return new AddressResponse(
        a.getId(), a.getLabel(), a.getLine1(), a.getLine2(), a.getCity(),
        a.getState(), a.getPostalCode(), a.getCountry(), a.isDefaultAddress());
  }
}