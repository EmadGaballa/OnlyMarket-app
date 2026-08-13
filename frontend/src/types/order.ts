import type { AddressRequest } from "./auth";
import type { CardBrand } from "./payment";

export type OrderStatus = "PREPARING";

export type PaymentMethod = "CARD" | "CASH_ON_DELIVERY";

/** A single order line item (mirrors backend {@code OrderItemResponse}). */
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** Order aggregate (mirrors backend {@code OrderResponse}). */
export interface Order {
  id: number;
  status: OrderStatus;
  addressId: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cardBrand: CardBrand | null;
  cardLast4: string | null;
  couponCode: string | null;
  createdAt: string;
  items: OrderItem[];
}

/** Request body for {@code POST /api/v1/orders}. */
export interface PlaceOrderRequest {
  addressId?: number;
  newAddress?: AddressRequest;
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  couponCode?: string;
}
