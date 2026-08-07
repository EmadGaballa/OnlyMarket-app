package com.platform.ecommerce.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create/update address request payload. */
public record AddressRequest(
    @Schema(description = "Address label, e.g. 'Home' or 'Work'", example = "Home")
    @NotBlank(message = "Label is required")
    @Size(max = 50)
    String label,

    @Schema(description = "First address line", example = "123 Market Street")
    @NotBlank(message = "Address line 1 is required")
    @Size(max = 255)
    String line1,

    @Schema(description = "Second address line (optional)", example = "Apt 4B")
    @Size(max = 255)
    String line2,

    @Schema(description = "City", example = "San Francisco")
    @NotBlank(message = "City is required")
    @Size(max = 100)
    String city,

    @Schema(description = "State / province", example = "CA")
    @NotBlank(message = "State is required")
    @Size(max = 100)
    String state,

    @Schema(description = "Postal code", example = "94103")
    @NotBlank(message = "Postal code is required")
    @Size(max = 20)
    String postalCode,

    @Schema(description = "Country", example = "United States")
    @NotBlank(message = "Country is required")
    @Size(max = 100)
    String country,

    @Schema(description = "Whether this is the default address", example = "true")
    boolean isDefault) {}