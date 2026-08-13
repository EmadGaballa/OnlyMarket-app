package com.platform.ecommerce.order;

import com.platform.ecommerce.cart.CartService;
import com.platform.ecommerce.cart.dto.CartItemResponse;
import com.platform.ecommerce.cart.dto.CartResponse;
import com.platform.ecommerce.catalog.product.ProductRepository;
import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.common.exception.ValidationException;
import com.platform.ecommerce.order.coupon.CouponService;
import com.platform.ecommerce.order.domain.CardBrand;
import com.platform.ecommerce.order.domain.Order;
import com.platform.ecommerce.order.domain.OrderItem;
import com.platform.ecommerce.order.domain.OrderStatus;
import com.platform.ecommerce.order.domain.PaymentMethod;
import com.platform.ecommerce.order.dto.OrderItemResponse;
import com.platform.ecommerce.order.dto.OrderResponse;
import com.platform.ecommerce.order.dto.PlaceOrderRequest;
import com.platform.ecommerce.user.AddressRepository;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.Address;
import com.platform.ecommerce.user.domain.User;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Order orchestration: place an order from the current cart, list a user's
 * orders, and delete an order.
 *
 * <p>Security note: the full card number and CVV are validated and then
 * discarded — only the card brand and last four digits are ever persisted,
 * exactly like real payment processors expose to merchants.</p>
 */
@Service
public class OrderService {

  private final OrderRepository orderRepository;
  private final CartService cartService;
  private final AddressRepository addressRepository;
  private final UserRepository userRepository;
  private final ProductRepository productRepository;
  private final CouponService couponService;

  public OrderService(
      OrderRepository orderRepository,
      CartService cartService,
      AddressRepository addressRepository,
      UserRepository userRepository,
      ProductRepository productRepository,
      CouponService couponService) {
    this.orderRepository = orderRepository;
    this.cartService = cartService;
    this.addressRepository = addressRepository;
    this.userRepository = userRepository;
    this.productRepository = productRepository;
    this.couponService = couponService;
  }

  /**
   * Place an order from the user's current cart, snapshotting each line item.
   * The cart is cleared on success.
   */
  @Transactional
  public OrderResponse placeOrder(Long userId, PlaceOrderRequest request) {
    CartResponse cart = cartService.listItems(userId);
    if (cart.items() == null || cart.items().isEmpty()) {
      throw new ValidationException("Your cart is empty");
    }

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    Address address = resolveAddress(userId, request);

    PaymentMethod method = request.paymentMethod();
    CardBrand cardBrand = null;
    String cardLast4 = null;
    if (method == PaymentMethod.CARD) {
      String number = validateCard(request);
      cardBrand = detectBrand(number);
      cardLast4 = last4(number);
    }

    BigDecimal subtotal = cart.subtotal();
    BigDecimal discount = BigDecimal.ZERO;
    String couponCode = null;
    if (request.couponCode() != null && !request.couponCode().isBlank()) {
      couponCode = request.couponCode().trim().toUpperCase();
      discount = couponService.computeDiscount(couponCode, subtotal);
    }
    BigDecimal total = subtotal.subtract(discount).max(BigDecimal.ZERO);

    Order order = new Order();
    order.setUser(user);
    order.setAddress(address);
    order.setStatus(OrderStatus.PREPARING);
    order.setSubtotal(subtotal);
    order.setDiscountAmount(discount);
    order.setTotal(total);
    order.setPaymentMethod(method);
    order.setCardBrand(cardBrand);
    order.setCardLast4(cardLast4);
    order.setCouponCode(couponCode);

    for (CartItemResponse item : cart.items()) {
      Product product = productRepository.findById(item.productId())
          .orElseThrow(() -> new ResourceNotFoundException("Product", item.productId()));
      OrderItem orderItem = new OrderItem();
      orderItem.setOrder(order);
      orderItem.setProduct(product);
      orderItem.setProductNameSnapshot(item.productName());
      orderItem.setProductImageSnapshot(item.imageUrl());
      orderItem.setUnitPrice(item.unitPrice());
      orderItem.setQuantity(item.quantity());
      order.getItems().add(orderItem);
    }

    Order saved = orderRepository.save(order);
    cartService.clear(userId);

    return toResponse(saved);
  }

  @Transactional(readOnly = true)
  public List<OrderResponse> getOrdersForUser(Long userId) {
    return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  /** Delete an order, verifying it belongs to {@code userId} (ownership check). */
  @Transactional
  public void deleteOrder(Long userId, Long orderId) {
    Order order = orderRepository.findByIdAndUserId(orderId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    // OrderItems are removed via cascade.
    orderRepository.delete(order);
  }

  /* ------------------------------------------------------------------------ */
  /* Helpers                                                                   */
  /* ------------------------------------------------------------------------ */

  private Address resolveAddress(Long userId, PlaceOrderRequest request) {
    if (request.addressId() != null) {
      return addressRepository.findByIdAndUserId(request.addressId(), userId)
          .orElseThrow(() -> new ValidationException("Selected address is invalid"));
    }
    if (request.newAddress() != null) {
      User user = userRepository.findById(userId)
          .orElseThrow(() -> new ResourceNotFoundException("User", userId));
      Address address = new Address();
      address.setUser(user);
      address.setLabel(request.newAddress().label());
      address.setLine1(request.newAddress().line1());
      address.setLine2(request.newAddress().line2());
      address.setCity(request.newAddress().city());
      address.setState(request.newAddress().state());
      address.setPostalCode(request.newAddress().postalCode());
      address.setCountry(request.newAddress().country());
      address.setDefaultAddress(false);
      return addressRepository.save(address);
    }
    throw new ValidationException("A delivery address is required");
  }

  /**
   * Validate the card fields and return the normalized (digits-only) number.
   * Fails fast on any rule so "successful only if requirements are met".
   */
  private String validateCard(PlaceOrderRequest request) {
    String number = digitsOnly(request.cardNumber());
    if (number == null || number.length() < 13 || number.length() > 19) {
      throw new ValidationException("A valid card number is required");
    }
    if (!luhnCheck(number)) {
      throw new ValidationException("Card number is invalid (checksum failed)");
    }
    if (request.cardholderName() == null || request.cardholderName().isBlank()) {
      throw new ValidationException("Cardholder name is required");
    }
    if (request.expiryMonth() == null || request.expiryYear() == null) {
      throw new ValidationException("Card expiry is required");
    }
    if (request.expiryMonth() < 1 || request.expiryMonth() > 12) {
      throw new ValidationException("Card expiry month is invalid");
    }
    YearMonth expiry = YearMonth.of(request.expiryYear(), request.expiryMonth());
    if (expiry.isBefore(YearMonth.now())) {
      throw new ValidationException("Card has expired");
    }
    if (request.cvv() == null || !request.cvv().matches("\\d{3,4}")) {
      throw new ValidationException("CVV must be 3 or 4 digits");
    }
    return number;
  }

  private String digitsOnly(String value) {
    if (value == null) {
      return null;
    }
    return value.replaceAll("\\D", "");
  }

  /** Standard Luhn checksum over the card number. */
  private boolean luhnCheck(String number) {
    int sum = 0;
    boolean doubleDigit = false;
    for (int i = number.length() - 1; i >= 0; i--) {
      int digit = number.charAt(i) - '0';
      if (doubleDigit) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      doubleDigit = !doubleDigit;
    }
    return sum % 10 == 0;
  }

  /** Derive the card brand from the leading digits (BIN-range detection). */
  private CardBrand detectBrand(String number) {
    if (number.startsWith("4")) {
      return CardBrand.VISA;
    }
    if (number.matches("^(51|52|53|54|55).*")
        || number.matches("^(222[1-9]|22[3-9]\\d|2[3-6]\\d{2}|27[01]\\d|2720).*")) {
      return CardBrand.MASTERCARD;
    }
    if (number.startsWith("34") || number.startsWith("37")) {
      return CardBrand.AMEX;
    }
    throw new ValidationException("Card brand not recognized");
  }

  private String last4(String number) {
    String digits = digitsOnly(number);
    return digits.substring(digits.length() - 4);
  }

  private OrderResponse toResponse(Order order) {
    List<OrderItemResponse> items = order.getItems().stream()
        .map(oi -> new OrderItemResponse(
            oi.getId(),
            oi.getProduct().getId(),
            oi.getProductNameSnapshot(),
            oi.getProductImageSnapshot(),
            oi.getUnitPrice(),
            oi.getQuantity(),
            oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity()))))
        .toList();

    return new OrderResponse(
        order.getId(),
        order.getStatus(),
        order.getAddress().getId(),
        order.getSubtotal(),
        order.getDiscountAmount(),
        order.getTotal(),
        order.getPaymentMethod(),
        order.getCardBrand(),
        order.getCardLast4(),
        order.getCouponCode(),
        order.getCreatedAt(),
        items);
  }
}