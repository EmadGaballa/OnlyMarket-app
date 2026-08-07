package com.platform.ecommerce.auth;

import com.platform.ecommerce.auth.dto.AuthResponse;
import com.platform.ecommerce.auth.dto.ForgotPasswordRequest;
import com.platform.ecommerce.auth.dto.LoginRequest;
import com.platform.ecommerce.auth.dto.RegisterRequest;
import com.platform.ecommerce.auth.dto.ResetPasswordRequest;
import com.platform.ecommerce.common.exception.BadCredentialsException;
import com.platform.ecommerce.common.exception.DuplicateResourceException;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.notification.MailService;
import com.platform.ecommerce.security.JwtService;
import com.platform.ecommerce.user.RoleRepository;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.Role;
import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.user.domain.UserStatus;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication orchestration: register, login, refresh, logout,
 * password reset, and email verification.
 *
 * <p>Each session-producing method returns a {@link Session} carrying the
 * {@link AuthResponse} (access token in body) plus the raw refresh token
 * so the controller can set it as an HTTP-only cookie. Logout revokes the
 * refresh token server-side and blacklists the access token's {@code jti}
 * in Redis.</p>
 */
@Service
public class AuthService {

  private static final String BLACKLIST_PREFIX = "revoked:";
  private static final String RESET_PREFIX = "reset:";

  private final UserRepository userRepository;
  private final RoleRepository roleRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final RefreshTokenService refreshTokenService;
  private final RedisTemplate<String, Object> redisTemplate;
  private final MailService mailService;

  public AuthService(
      UserRepository userRepository,
      RoleRepository roleRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      RefreshTokenService refreshTokenService,
      RedisTemplate<String, Object> redisTemplate,
      MailService mailService) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.refreshTokenService = refreshTokenService;
    this.redisTemplate = redisTemplate;
    this.mailService = mailService;
  }

  @Transactional
  public Session register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email().toLowerCase())) {
      throw new DuplicateResourceException("User", "email", request.email());
    }

    Role customerRole = roleRepository.findByName("CUSTOMER")
        .orElseThrow(() -> new IllegalStateException("CUSTOMER role not seeded"));

    User user = new User();
    user.setEmail(request.email().toLowerCase());
    user.setFirstName(request.firstName());
    user.setLastName(request.lastName());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setStatus(UserStatus.ACTIVE);
    user.setRoles(Set.of(customerRole));
    userRepository.save(user);

    // Simulated verification email (Section 1.1)
    String verifyToken = UUID.randomUUID().toString();
    redisTemplate.opsForValue().set(
        "verifyToken:" + verifyToken, user.getId().toString(), Duration.ofHours(24));
    mailService.send(user.getEmail(), "Verify your email",
        "<p>Click <a href='http://localhost:5173/verify-email?token=" + verifyToken
            + "'>here</a> to verify your email.</p>");

    return buildSession(user);
  }

  @Transactional
  public Session login(LoginRequest request) {
    User user = userRepository.findByEmail(request.email().toLowerCase())
        .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new BadCredentialsException("Invalid email or password");
    }

    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new BadCredentialsException(
          "Account is " + user.getStatus().name().toLowerCase() + ". Contact support.");
    }

    return buildSession(user);
  }

  @Transactional
  public Session refresh(String rawRefreshToken) {
    RefreshTokenService.RotationResult result = refreshTokenService.rotate(rawRefreshToken);
    return buildSession(result.user(), result.rawToken());
  }

  @Transactional
  public void logout(String accessToken, String rawRefreshToken) {
    if (accessToken != null && !accessToken.isBlank()) {
      String jti = jwtService.extractJti(accessToken);
      long ttlSeconds = Duration.between(Instant.now(),
          jwtService.extractExpiration(accessToken)).getSeconds();
      if (ttlSeconds > 0) {
        redisTemplate.opsForValue().set(
            BLACKLIST_PREFIX + jti, "true", Duration.ofSeconds(ttlSeconds));
      }
    }
    if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
      refreshTokenService.revoke(rawRefreshToken);
    }
  }

  @Transactional
  public void forgotPassword(ForgotPasswordRequest request) {
    userRepository.findByEmail(request.email().toLowerCase()).ifPresent(user -> {
      String token = UUID.randomUUID().toString();
      redisTemplate.opsForValue().set(RESET_PREFIX + token, user.getId().toString(),
          Duration.ofMinutes(30));
      mailService.send(user.getEmail(), "Reset your password",
          "<p>Use this link to reset your password: "
              + "http://localhost:5173/reset-password?token=" + token + "</p>");
    });
    // Always returns 200 — no user enumeration.
  }

  @Transactional
  public void resetPassword(ResetPasswordRequest request) {
    Object userIdObj = redisTemplate.opsForValue().get(RESET_PREFIX + request.token());
    if (userIdObj == null) {
      throw new BadCredentialsException("Invalid or expired reset token");
    }
    Long userId = Long.valueOf(userIdObj.toString());
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    userRepository.save(user);
    redisTemplate.delete(RESET_PREFIX + request.token());
    refreshTokenService.revokeAllForUser(userId);
  }

  @Transactional
  public void verifyEmail(String token) {
    Object userIdObj = redisTemplate.opsForValue().get("verifyToken:" + token);
    if (userIdObj == null) {
      throw new BadCredentialsException("Invalid or expired verification token");
    }
    Long userId = Long.valueOf(userIdObj.toString());
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    user.setEmailVerified(true);
    userRepository.save(user);
    redisTemplate.delete("verifyToken:" + token);
  }

  private Session buildSession(User user) {
    RefreshTokenService.IssuedToken issued = refreshTokenService.issueToken(user);
    return buildSession(user, issued.rawToken());
  }

  private Session buildSession(User user, String rawRefreshToken) {
    JwtService.AccessToken accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());

    AuthResponse response = new AuthResponse(
        accessToken.token(),
        "Bearer",
        accessToken.expiresAt().getEpochSecond() - Instant.now().getEpochSecond(),
        toUserSummary(user));

    return new Session(response, rawRefreshToken);
  }

  private AuthResponse.UserSummary toUserSummary(User user) {
    List<String> roles = user.getRoles().stream()
        .map(Role::getName)
        .collect(Collectors.toList());
    List<String> permissions = user.getRoles().stream()
        .flatMap(r -> r.getPermissions().stream())
        .map(p -> p.getName())
        .distinct()
        .collect(Collectors.toList());
    return new AuthResponse.UserSummary(
        user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
        roles, permissions);
  }

  /** A complete authenticated session: response body + raw refresh token for the cookie. */
  public record Session(AuthResponse authResponse, String rawRefreshToken) {}
}