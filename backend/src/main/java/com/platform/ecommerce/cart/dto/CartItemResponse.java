package com.platform.ecommerce.cart.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

/**
 * Flat, self-contained cart line item response. Built eagerly inside the
 * transaction from the {@code findByCartIdWithDetails} fetch-joined query —
 * never serialized from raw JPA entities, so no lazy-loading surprises.
 */
public record CartItemResponse(
    @Schema(description = "Cart item id")
    Long id,

    @Schema(description = "Product variant id")
    Long productVariantId,

    @Schema(description = "Product id")
    Long productId,

    @Schema(description = "Product name", example = "Wireless Headphones")
    String productName,

    @Schema(description = "Product slug for deep linking", example = "wireless-headphones")
    String productSlug,

    @Schema(description = "Variant label e.g. 'Blue / Large', null when the variant has no attributes")
    String variantName,

    @Schema(description = "Variant SKU", example = "WH-1000XM5-BLU-L")
    String sku,

    @Schema(description = "Primary product image URL, null when the product has no images")
    String imageUrl,

    @Schema(description = "Effective unit price (variant override or product base price)", example = "199.99")
    BigDecimal unitPrice,

    @Schema(description = "Quantity in cart", example = "2")
    int quantity,

    @Schema(description = "Line total = unitPrice * quantity", example = "399.98")
    BigDecimal lineTotal,

    @Schema(description = "Whether the variant is currently available to buy")
    boolean inStock,

    @Schema(description = "Maximum quantity purchasable (stock quantity, or Integer.MAX_VALUE when untracked)")
    int maxAvailableQuantity) {}