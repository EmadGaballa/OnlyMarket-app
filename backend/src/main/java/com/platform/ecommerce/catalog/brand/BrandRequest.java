package com.platform.ecommerce.catalog.brand;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create/update brand request payload. */
public record BrandRequest(
    @Schema(description = "Brand name", example = "Sony")
    @NotBlank(message = "Name is required")
    @Size(max = 150)
    String name) {}