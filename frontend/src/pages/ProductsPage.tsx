import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import type { Product, Category, Brand, PagedResponse } from '../types/catalog';
import styles from './ProductsPage.module.css';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<PagedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page') || '0');
  const size = Number(searchParams.get('size') || '12');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.listCategories,
  });

  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: productsApi.listBrands,
  });

  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products', search, categoryId, brandId, sort, page, size],
    queryFn: () =>
      productsApi.list({
        search: search || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        brandId: brandId ? Number(brandId) : undefined,
        sort: sort || undefined,
        page,
        size,
      }),
  });

  useEffect(() => {
    if (productsData) setData(productsData);
    if (productsError) setError('Failed to load products');
    setLoading(productsLoading);
  }, [productsData, productsError, productsLoading]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '0');
    setSearchParams(next);
  };

  if (loading) return <div className={styles.page}><div className={styles.loading}>Loading products...</div></div>;
  if (error) return <div className={styles.page}><div className={styles.error}>{error}</div></div>;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => updateParam('search', e.target.value)}
        />
        <select value={categoryId} onChange={(e) => updateParam('categoryId', e.target.value)}>
          <option value="">All Categories</option>
          {categories?.map((cat: Category) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <select value={brandId} onChange={(e) => updateParam('brandId', e.target.value)}>
          <option value="">All Brands</option>
          {brands?.map((brand: Brand) => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
          <option value="">Sort</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      {data.content.length === 0 ? (
        <div className={styles.emptyState}>No products found.</div>
      ) : (
        <div className={styles.productGrid}>
          {data.content.map((product) => (
            <Link to={`/products/${product.slug}`} key={product.id} className={styles.productCard}>
              <div className={styles.productImage}>
                {product.images[0] ? (
                  <img src={product.images[0].url} alt={product.name} />
                ) : (
                  <div className={styles.placeholder}>No image</div>
                )}
              </div>
              <div className={styles.productInfo}>
                <h3>{product.name}</h3>
                <p className={styles.price}>${product.basePrice.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className={styles.pagination}>
        <button disabled={page === 0} onClick={() => updateParam('page', String(page - 1))}>Previous</button>
        <span>Page {page + 1} of {data.totalPages}</span>
        <button disabled={page + 1 >= data.totalPages} onClick={() => updateParam('page', String(page + 1))}>Next</button>
      </div>
    </div>
  );
}