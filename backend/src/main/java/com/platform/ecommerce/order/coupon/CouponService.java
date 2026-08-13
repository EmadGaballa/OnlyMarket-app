package com.platform.ecommerce.order.coupon;

import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.common.exception.ValidationException;
import com.platform.ecommerce.order.coupon.domain.Coupon;
import com.platform.ecommerce.order.coupon.domain.DiscountType;
import com.platform.ecommerce.order.coupon.dto.ValidateCouponRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Coupon lookups and discount computation. */
@Service
public class CouponService {

  private final CouponRepository couponRepository;

  public CouponService(CouponRepository couponRepository) {
    this.couponRepository = couponRepository;
  }

  /**
   * Validate a coupon code and return the computed discount for the given
   * subtotal. Throws if the coupon does not exist, is inactive, or has
   * expired.
   */
  @Transactional(readOnly = true)
  public BigDecimal computeDiscount(String code, BigDecimal subtotal) {
    Coupon coupon = couponRepository.findByCode(normalize(code))
        .orElseThrow(() -> new ResourceNotFoundException("Coupon with code '" + code + "'"));

    if (!coupon.isActive()) {
      throw new ValidationException("Coupon '" + code + "' is no longer active");
    }
    if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(Instant.now())) {
      throw new ValidationException("Coupon '" + code + "' has expired");
    }

    BigDecimal discount;
    if (coupon.getDiscountType() == DiscountType.PERCENT) {
      BigDecimal percent = coupon.getDiscountValue().min(new BigDecimal("100"));
      discount = subtotal.multiply(percent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    } else {
      discount = coupon.getDiscountValue();
    }

    // A discount can never exceed the subtotal.
    return discount.min(subtotal).setScale(2, RoundingMode.HALF_UP);
  }

  /** Convenience wrapper for the validate endpoint. */
  @Transactional(readOnly = true)
  public CouponValidationResult validate(ValidateCouponRequest request) {
    String code = normalize(request.code());
    BigDecimal discount = computeDiscount(code, request.subtotal());
    Coupon coupon = couponRepository.findByCode(code).orElseThrow();
    return new CouponValidationResult(
        coupon.getCode(), coupon.getDiscountType(), coupon.getDiscountValue(), discount);
  }

  private String normalize(String code) {
    return code == null ? null : code.trim().toUpperCase();
  }

  public record CouponValidationResult(
      String code, DiscountType discountType, BigDecimal discountValue, BigDecimal discountAmount) {}
}