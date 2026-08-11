package com.platform.ecommerce.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Request body for {@code POST /api/v1/cart/items}. */
public record AddCartItemRequest(
    @NotNull(message = "productVariantId is required")
    @Schema(description = "Product variant id", example = "42")
    Long productVariantId,

    @Min(value = 1, message = "quantity must be at least 1")
    @Schema(description = "Quantity to add", example = "1")
    int quantity) {}