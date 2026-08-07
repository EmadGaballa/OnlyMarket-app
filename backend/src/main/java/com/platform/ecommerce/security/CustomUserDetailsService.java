package com.platform.ecommerce.security;

import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads a user's Spring Security principal from the database.
 *
 * <p>Authorities are the flattened set of {@code Permission}s across the
 * user's roles (e.g. {@code PRODUCT_CREATE}), so {@code @PreAuthorize}
 * can check permissions rather than role names. Additionally each role
 * name is added as a {@code ROLE_} authority to support
 * {@code hasRole(...)} where convenient.</p>
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  public CustomUserDetailsService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    return toUserDetails(user);
  }

  @Transactional(readOnly = true)
  public UserDetails loadUserById(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    return toUserDetails(user);
  }

  private UserDetails toUserDetails(User user) {
    Set<GrantedAuthority> authorities = user.getRoles().stream()
        .flatMap(role -> role.getPermissions().stream())
        .map(permission -> (GrantedAuthority) new SimpleGrantedAuthority(permission.getName()))
        .collect(Collectors.toSet());

    user.getRoles().stream()
        .map(role -> (GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.getName()))
        .forEach(authorities::add);

    return org.springframework.security.core.userdetails.User.builder()
        .username(user.getEmail())
        .password(user.getPasswordHash())
        .authorities(authorities)
        .disabled(!UserStatusChecker.isActive(user))
        .build();
  }

  /** Internal helper keeps user-status logic in one place. */
  private static final class UserStatusChecker {
    static boolean isActive(User user) {
      return user.getStatus() == com.platform.ecommerce.user.domain.UserStatus.ACTIVE;
    }
  }
}