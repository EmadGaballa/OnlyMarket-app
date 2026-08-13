package com.platform.ecommerce.order.coupon.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/** Validate-coupon request payload. */
public record ValidateCouponRequest(
    @Schema(description = "Coupon code", example = "SAVE10")
    @NotBlank(message = "Coupon code is required")
    String code,

    @Schema(description = "Order subtotal the coupon would be applied to", example = "199.99")
    @NotNull(message = "Subtotal is required")
    @DecimalMin(value = "0.0", message = "Subtotal must be positive")
    BigDecimal subtotal) {}