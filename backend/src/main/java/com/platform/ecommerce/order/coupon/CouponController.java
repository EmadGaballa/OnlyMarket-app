package com.platform.ecommerce.order.coupon;

import com.platform.ecommerce.order.coupon.dto.CouponValidationResponse;
import com.platform.ecommerce.order.coupon.dto.ValidateCouponRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Coupon endpoints. */
@RestController
@RequestMapping("/api/v1/coupons")
@Tag(name = "Coupons")
public class CouponController {

  private final CouponService couponService;

  public CouponController(CouponService couponService) {
    this.couponService = couponService;
  }

  @PostMapping("/validate")
  @Operation(summary = "Validate a coupon and compute its discount for a subtotal")
  public ResponseEntity<CouponValidationResponse> validate(
      @Valid @RequestBody ValidateCouponRequest request) {
    CouponService.CouponValidationResult result = couponService.validate(request);
    return ResponseEntity.ok(new CouponValidationResponse(
        result.code(), result.discountType(), result.discountValue(), result.discountAmount()));
  }
}