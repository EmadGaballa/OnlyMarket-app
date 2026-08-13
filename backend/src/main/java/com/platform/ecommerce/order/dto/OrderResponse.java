package com.platform.ecommerce.order.dto;

import com.platform.ecommerce.order.domain.CardBrand;
import com.platform.ecommerce.order.domain.OrderStatus;
import com.platform.ecommerce.order.domain.PaymentMethod;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/** Order aggregate returned to clients (never the raw entity). */
public record OrderResponse(
    @Schema(description = "Order id")
    Long id,

    @Schema(description = "Order status", example = "PREPARING")
    OrderStatus status,

    @Schema(description = "Delivery address id")
    Long addressId,

    @Schema(description = "Subtotal before discount")
    BigDecimal subtotal,

    @Schema(description = "Discount applied via coupon")
    BigDecimal discountAmount,

    @Schema(description = "Final total")
    BigDecimal total,

    @Schema(description = "Payment method", example = "CARD")
    PaymentMethod paymentMethod,

    @Schema(description = "Card brand, null for cash on delivery", example = "VISA")
    CardBrand cardBrand,

    @Schema(description = "Last four digits of the card, null for cash on delivery", example = "4242")
    String cardLast4,

    @Schema(description = "Coupon code applied, if any", example = "SAVE10")
    String couponCode,

    @Schema(description = "Order creation timestamp")
    Instant createdAt,

    @Schema(description = "Order line items")
    List<OrderItemResponse> items) {}