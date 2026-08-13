package com.platform.ecommerce.order;

import com.platform.ecommerce.order.domain.Order;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Order}. */
public interface OrderRepository extends JpaRepository<Order, Long> {

  /** Orders belonging to a user, most recent first. */
  List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

  /** Fetch a single order only if it belongs to the given user (ownership check). */
  Optional<Order> findByIdAndUserId(Long id, Long userId);
}