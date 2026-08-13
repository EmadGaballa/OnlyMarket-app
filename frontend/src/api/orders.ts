import { api } from "./client";
import type { Order, PlaceOrderRequest } from "../types/order";

export const ordersApi = {
  placeOrder: (data: PlaceOrderRequest) => api.post<Order>("/orders", data),

  getOrders: () => api.get<Order[]>("/orders"),

  deleteOrder: (orderId: number) => api.delete<void>(`/orders/${orderId}`),
};