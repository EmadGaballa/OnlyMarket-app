package com.platform.ecommerce.order.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/** A single order line item returned to clients. */
public record OrderItemResponse(
    @Schema(description = "Order item id")
    Long id,

    @Schema(description = "Product id")
    Long productId,

    @Schema(description = "Product name snapshot at order time")
    String productName,

    @Schema(description = "Primary product image snapshot at order time")
    String productImageUrl,

    @Schema(description = "Unit price snapshot at order time")
    BigDecimal unitPrice,

    @Schema(description = "Quantity ordered")
    int quantity,

    @Schema(description = "Line total = unitPrice * quantity")
    BigDecimal lineTotal) {}