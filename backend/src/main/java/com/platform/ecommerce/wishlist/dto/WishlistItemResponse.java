package com.platform.ecommerce.wishlist.dto;

import java.math.BigDecimal;

public record WishlistItemResponse(
        Long id,
        Long productId,
        String productName,
        String productSlug,
        String imageUrl,
        BigDecimal basePrice) {
}