import { api } from "./client";

export interface Review {
  id: number;
  productId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface RatingSummary {
  averageRating: number;
  reviewCount: number;
  distribution?: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}

export const ratingsApi = {
  getSummaryByProductId: (productId: number | string) =>
    api.get<RatingSummary>(`/products/${productId}/ratings/summary`),

  getReviews: async (
    productId: number | string,
    params?: { page?: number; size?: number },
  ) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.set("page", String(params.page));
    if (params?.size !== undefined) query.set("size", String(params.size));
    const qs = query.toString();
    const data = await api.get<Review[]>(
      `/products/${productId}/reviews${qs ? `?${qs}` : ""}`,
    );
    return { data };
  },

  submitReview: (productId: number | string, payload: CreateReviewPayload) =>
    api.post<Review>(`/products/${productId}/reviews`, payload),
};
