package com.platform.ecommerce.order.coupon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A discount coupon that can be applied at checkout. */
@Entity
@Table(name = "coupons")
@Getter
@Setter
@NoArgsConstructor
public class Coupon {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 50)
  private String code;

  @Enumerated(EnumType.STRING)
  @Column(name = "discount_type", nullable = false, length = 20)
  private DiscountType discountType;

  /** Percentage (0-100) or fixed amount depending on {@link #discountType}. */
  @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
  private BigDecimal discountValue;

  @Column(nullable = false)
  private boolean active = true;

  @Column(name = "expires_at")
  private Instant expiresAt;
}