package com.platform.ecommerce.catalog.product.dto;

import java.time.Instant;

public record ReviewResponse(
                Long id,
                int rating,
                String comment,
                String userName,
                Instant createdAt) {
}