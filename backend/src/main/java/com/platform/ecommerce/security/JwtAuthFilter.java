package com.platform.ecommerce.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT authentication filter.
 *
 * <p>Extracts the {@code Authorization: Bearer <token>} header, validates
 * the token signature/expiry, checks the Redis blacklist for a revoked
 * {@code jti}, and populates the security context with the user's
 * authorities (permissions).</p>
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final String BEARER_PREFIX = "Bearer ";
  private static final String BLACKLIST_PREFIX = "revoked:";

  private final JwtService jwtService;
  private final CustomUserDetailsService userDetailsService;
  private final RedisTemplate<String, Object> redisTemplate;

  public JwtAuthFilter(
      JwtService jwtService,
      CustomUserDetailsService userDetailsService,
      RedisTemplate<String, Object> redisTemplate) {
    this.jwtService = jwtService;
    this.userDetailsService = userDetailsService;
    this.redisTemplate = redisTemplate;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String header = request.getHeader("Authorization");
    if (header == null || !header.startsWith(BEARER_PREFIX)) {
      filterChain.doFilter(request, response);
      return;
    }

    String token = header.substring(BEARER_PREFIX.length());

    try {
      if (jwtService.isValid(token) && !isBlacklisted(token)) {
        Claims claims = jwtService.parseToken(token);
        Long userId = claims.get("uid", Long.class);
        UserDetails userDetails = userDetailsService.loadUserById(userId);

        UsernamePasswordAuthenticationToken authentication =
            new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
      }
    } catch (Exception e) {
      // Invalid token — leave context unauthenticated; downstream
      // authorization will reject the request with 401/403.
    }

    filterChain.doFilter(request, response);
  }

  private boolean isBlacklisted(String token) {
    String jti = jwtService.extractJti(token);
    return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + jti));
  }
}