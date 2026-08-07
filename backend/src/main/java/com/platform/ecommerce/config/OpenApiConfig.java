package com.platform.ecommerce.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration.
 *
 * <p>Documents the Bearer JWT security scheme used by all authenticated
 * endpoints. The refresh-token cookie is documented on the auth endpoints
 * themselves via {@code @Operation} annotations.</p>
 */
@Configuration
public class OpenApiConfig {

  private static final String SECURITY_SCHEME_NAME = "bearerAuth";

  @Bean
  public OpenAPI ecommerceOpenAPI() {
    return new OpenAPI()
        .info(new Info()
            .title("Enterprise E-Commerce Platform API")
            .description("""
                B2B-style commerce infrastructure: multi-seller marketplace,
                inventory management, order state machine, RBAC, and analytics.
                Base path: /api/v1
                """)
            .version("v1.0.0")
            .contact(new Contact()
                .name("Platform Engineering")
                .email("dev@ecommerce.local"))
            .license(new License()
                .name("Proprietary")
                .url("https://ecommerce.local/license")))
        .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
        .components(new Components()
            .addSecuritySchemes(SECURITY_SCHEME_NAME,
                new SecurityScheme()
                    .name(SECURITY_SCHEME_NAME)
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("Access token returned by POST /auth/login")));
  }
}