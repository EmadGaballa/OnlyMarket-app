import { api } from './client';
import type { Product, Category, Brand, PagedResponse } from '../types/catalog';

export const productsApi = {
  list: (params?: {
    search?: string;
    categoryId?: number;
    brandId?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    size?: number;
    express?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.categoryId) query.set('categoryId', String(params.categoryId));
    if (params?.brandId) query.set('brandId', String(params.brandId));
    if (params?.minPrice !== undefined) query.set('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) query.set('maxPrice', String(params.maxPrice));
    if (params?.sort) query.set('sort', params.sort);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.size !== undefined) query.set('size', String(params.size));
    const qs = query.toString();
    return api.get<PagedResponse<Product>>(`/products${qs ? `?${qs}` : ''}`);
  },

  getBySlug: (slug: string) =>
    api.get<Product>(`/products/${slug}`),

  listCategories: () =>
    api.get<Category[]>('/categories'),

  listBrands: () =>
    api.get<Brand[]>('/brands'),
};