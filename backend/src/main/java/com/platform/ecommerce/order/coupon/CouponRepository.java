package com.platform.ecommerce.order.coupon;

import com.platform.ecommerce.order.coupon.domain.Coupon;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Coupon}. */
public interface CouponRepository extends JpaRepository<Coupon, Long> {

  Optional<Coupon> findByCode(String code);

  boolean existsByCode(String code);
}