package com.platform.ecommerce.order.coupon.dto;

import com.platform.ecommerce.order.coupon.domain.DiscountType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/** Result of validating a coupon against a subtotal. */
public record CouponValidationResponse(
    @Schema(description = "Validated coupon code")
    String code,

    @Schema(description = "Discount type", example = "PERCENT")
    DiscountType discountType,

    @Schema(description = "Raw discount value (percentage or fixed amount)")
    BigDecimal discountValue,

    @Schema(description = "Computed discount amount applied to the given subtotal")
    BigDecimal discountAmount) {}