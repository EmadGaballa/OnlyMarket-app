package com.platform.ecommerce.catalog.category;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create/update category request payload. */
public record CategoryRequest(
    @Schema(description = "Category name", example = "Electronics")
    @NotBlank(message = "Name is required")
    @Size(max = 150)
    String name,

    @Schema(description = "URL-friendly slug", example = "electronics")
    @NotBlank(message = "Slug is required")
    @Size(max = 180)
    String slug,

    @Schema(description = "Parent category id (null for top-level)", example = "1")
    Long parentId) {}