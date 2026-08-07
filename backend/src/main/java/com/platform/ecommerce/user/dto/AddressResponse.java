package com.platform.ecommerce.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Address returned to clients (never the raw entity). */
public record AddressResponse(
    @Schema(description = "Address id")
    Long id,

    @Schema(description = "Address label", example = "Home")
    String label,

    @Schema(description = "First address line", example = "123 Market Street")
    String line1,

    @Schema(description = "Second address line", example = "Apt 4B")
    String line2,

    @Schema(description = "City", example = "San Francisco")
    String city,

    @Schema(description = "State / province", example = "CA")
    String state,

    @Schema(description = "Postal code", example = "94103")
    String postalCode,

    @Schema(description = "Country", example = "United States")
    String country,

    @Schema(description = "Whether this is the default address", example = "true")
    boolean isDefault) {}