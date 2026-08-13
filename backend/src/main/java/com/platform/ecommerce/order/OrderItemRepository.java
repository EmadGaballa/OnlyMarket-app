package com.platform.ecommerce.order;

import com.platform.ecommerce.order.domain.OrderItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Data access for {@link OrderItem}. */
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

  /**
   * Eagerly loads each line item's product so the response DTO can be built
   * inside the transaction without lazy-loading surprises.
   */
  @Query("""
        SELECT DISTINCT oi FROM OrderItem oi
        JOIN FETCH oi.product p
        WHERE oi.order.id = :orderId
      """)
  List<OrderItem> findByOrderIdWithProduct(@Param("orderId") Long orderId);
}