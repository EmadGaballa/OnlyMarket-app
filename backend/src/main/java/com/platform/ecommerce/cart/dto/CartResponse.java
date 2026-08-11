package com.platform.ecommerce.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.util.List;

/**
 * Cart aggregate response. Server-computed {@code subtotal} and {@code itemCount}
 * are the source of truth for the frontend order summary.
 */
public record CartResponse(
    @Schema(description = "Cart line items")
    List<CartItemResponse> items,

    @Schema(description = "Sum of all line totals", example = "399.98")
    BigDecimal subtotal,

    @Schema(description = "Sum of all quantities", example = "3")
    int itemCount) {}