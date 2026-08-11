package com.platform.ecommerce.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

/** Request body for {@code PUT /api/v1/cart/items/{cartItemId}}. */
public record UpdateCartItemRequest(
    @Min(value = 1, message = "quantity must be at least 1")
    @Schema(description = "New quantity for the cart item", example = "2")
    int quantity) {}