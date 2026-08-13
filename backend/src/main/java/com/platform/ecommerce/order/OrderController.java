package com.platform.ecommerce.order;

import com.platform.ecommerce.order.dto.OrderResponse;
import com.platform.ecommerce.order.dto.PlaceOrderRequest;
import com.platform.ecommerce.user.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Order endpoints, scoped to the authenticated user. */
@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders")
public class OrderController {

  private final OrderService orderService;
  private final UserProfileService userProfileService;

  public OrderController(OrderService orderService, UserProfileService userProfileService) {
    this.orderService = orderService;
    this.userProfileService = userProfileService;
  }

  @PostMapping
  @Operation(summary = "Place an order from the current cart")
  public ResponseEntity<OrderResponse> placeOrder(
      Authentication authentication,
      @Valid @RequestBody PlaceOrderRequest request) {
    return ResponseEntity.ok(orderService.placeOrder(currentUserId(authentication), request));
  }

  @GetMapping
  @Operation(summary = "List the current user's orders")
  public ResponseEntity<List<OrderResponse>> listOrders(Authentication authentication) {
    return ResponseEntity.ok(orderService.getOrdersForUser(currentUserId(authentication)));
  }

  @DeleteMapping("/{orderId}")
  @Operation(summary = "Delete the current user's order")
  public ResponseEntity<Void> deleteOrder(
      @PathVariable Long orderId,
      Authentication authentication) {
    orderService.deleteOrder(currentUserId(authentication), orderId);
    return ResponseEntity.noContent().build();
  }

  private Long currentUserId(Authentication authentication) {
    var principal = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
    return userProfileService.getUserByEmail(principal.getUsername()).getId();
  }
}