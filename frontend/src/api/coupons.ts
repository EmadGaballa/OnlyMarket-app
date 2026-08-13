import { api } from "./client";

export interface CouponValidationResponse {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  discountAmount: number;
}

export const couponsApi = {
  validateCoupon: (code: string, subtotal: number) =>
    api.post<CouponValidationResponse>("/coupons/validate", { code, subtotal }),
};