package com.platform.ecommerce.config;

import com.platform.ecommerce.security.JwtAuthFilter;
import com.platform.ecommerce.security.RateLimitFilter;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Spring Security configuration.
 *
 * <p>Stateless JWT authentication with an HTTP-only refresh cookie.
 * CSRF is mitigated via SameSite=Strict + the X-Requested-With header
 * requirement on the refresh endpoint (see {@code AuthController}).
 * Secure headers are applied per Section 9.7.</p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final RateLimitFilter rateLimitFilter;

  @Value("${app.cors.allowed-origins}")
  private String allowedOrigins;

  public SecurityConfig(JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter) {
    this.jwtAuthFilter = jwtAuthFilter;
    this.rateLimitFilter = rateLimitFilter;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health", "/actuator/info").permitAll()
            .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login",
                "/api/v1/auth/refresh", "/api/v1/auth/forgot-password",
                "/api/v1/auth/reset-password", "/api/v1/auth/verify-email").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/products/**", "/api/v1/categories/**",
                "/api/v1/brands/**").permitAll()
            .anyRequest().authenticated())
        .headers(headers -> headers
            .contentSecurityPolicy(csp -> csp.policyDirectives(
                "default-src 'self'; frame-ancestors 'none'"))
            .contentTypeOptions(cto -> cto.disable())
            .frameOptions(fo -> fo.deny())
            .referrerPolicy(rp -> rp.policy(
                org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter
                    .ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true)
                .maxAgeInSeconds(31536000)))
        // In Spring Security 6.x an anchor filter must have a registered order, so custom
        // filters cannot be anchored to one another. Each is anchored to a distinct built-in
        // registered filter: JwtAuthFilter runs just before UsernamePasswordAuthenticationFilter,
        // and RateLimitFilter runs before SecurityContextHolderFilter (which precedes it in the
        // chain), preserving the intent that the rate limiter executes before JWT authentication.
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(rateLimitFilter, SecurityContextHolderFilter.class);

    return http.build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    config.setExposedHeaders(List.of("Retry-After"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}