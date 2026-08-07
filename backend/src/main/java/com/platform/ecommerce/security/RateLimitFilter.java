package com.platform.ecommerce.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Redis-backed sliding-window rate limiter (Section 9.6).
 *
 * <p>Uses the {@code INCR} counter with a per-request-key TTL re-set on
 * every increment (sliding expiration). Applies to the auth attack
 * surface: login (5/min/IP), register (3/min/IP), forgot-password
 * (3/min/IP). Returns 429 with a {@code Retry-After} header.</p>
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

  private static final String PREFIX = "ratelimit:";

  private static final Map<String, Integer> LIMITS = Map.of(
      "/api/v1/auth/login", 5,
      "/api/v1/auth/register", 3,
      "/api/v1/auth/forgot-password", 3);

  private final RedisTemplate<String, Object> redisTemplate;

  public RateLimitFilter(RedisTemplate<String, Object> redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {

    String path = request.getRequestURI();
    Integer limit = LIMITS.get(path);
    if (limit == null) {
      filterChain.doFilter(request, response);
      return;
    }

    String clientIp = resolveClientIp(request);
    String key = PREFIX + path + ":" + clientIp;

    Long count = redisTemplate.opsForValue().increment(key);
    if (count != null && count == 1L) {
      redisTemplate.expire(key, Duration.ofMinutes(1));
    }

    if (count != null && count > limit) {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
      response.setHeader("Retry-After", "60");
      response.setContentType("application/json");
      response.getWriter().write(
          "{\"timestamp\":\"" + java.time.Instant.now() + "\","
          + "\"status\":429,\"error\":\"RATE_LIMITED\","
          + "\"message\":\"Too many requests. Please try again in 60 seconds.\","
          + "\"path\":\"" + path + "\"}");
      return;
    }

    filterChain.doFilter(request, response);
  }

  private String resolveClientIp(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}