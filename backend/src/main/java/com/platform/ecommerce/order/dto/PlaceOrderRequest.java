package com.platform.ecommerce.order.dto;

import com.platform.ecommerce.order.domain.PaymentMethod;
import com.platform.ecommerce.user.dto.AddressRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Place-order request payload.
 *
 * <p>Card fields are only required/validated when {@code paymentMethod == CARD}
 * (validation happens in the service so {@code CASH_ON_DELIVERY} never trips
 * the card checks). Either {@code addressId} (an existing saved address) or
 * {@code newAddress} (an inline address to be saved first) must be supplied.</p>
 */
public record PlaceOrderRequest(
    @Schema(description = "Existing saved address id", example = "3")
    Long addressId,

    @Schema(description = "Inline new address to save to the account before ordering")
    AddressRequest newAddress,

    @Schema(description = "Payment method", example = "CARD")
    @NotNull(message = "Payment method is required")
    PaymentMethod paymentMethod,

    @Schema(description = "Card number (digits only, required when paying by card)")
    @Size(max = 19)
    String cardNumber,

    @Schema(description = "Cardholder name (required when paying by card)")
    @Size(max = 200)
    String cardholderName,

    @Schema(description = "Card expiry month 1-12 (required when paying by card)")
    Integer expiryMonth,

    @Schema(description = "Card expiry year, 4 digits (required when paying by card)")
    Integer expiryYear,

    @Schema(description = "Card CVV, 3-4 digits (required when paying by card)")
    @Size(max = 4)
    String cvv,

    @Schema(description = "Optional coupon code", example = "SAVE10")
    @Size(max = 50)
    String couponCode) {}