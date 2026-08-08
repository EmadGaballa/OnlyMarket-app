package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.brand.BrandRepository;
import com.platform.ecommerce.catalog.brand.domain.Brand;
import com.platform.ecommerce.catalog.category.CategoryRepository;
import com.platform.ecommerce.catalog.category.domain.Category;
import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.catalog.product.domain.ProductImage;
import com.platform.ecommerce.catalog.product.dto.ProductRequest;
import com.platform.ecommerce.catalog.product.dto.ProductResponse;
import com.platform.ecommerce.catalog.variant.ProductVariantRepository;
import com.platform.ecommerce.catalog.variant.domain.ProductVariant;
import com.platform.ecommerce.common.dto.PagedResponse;
import com.platform.ecommerce.common.exception.DuplicateResourceException;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

  private final ProductRepository productRepository;
  private final ProductImageRepository productImageRepository;
  private final ProductVariantRepository productVariantRepository;
  private final BrandRepository brandRepository;
  private final CategoryRepository categoryRepository;
  private final UserRepository userRepository;

  public ProductService(
      ProductRepository productRepository,
      ProductImageRepository productImageRepository,
      ProductVariantRepository productVariantRepository,
      BrandRepository brandRepository,
      CategoryRepository categoryRepository,
      UserRepository userRepository) {
    this.productRepository = productRepository;
    this.productImageRepository = productImageRepository;
    this.productVariantRepository = productVariantRepository;
    this.brandRepository = brandRepository;
    this.categoryRepository = categoryRepository;
    this.userRepository = userRepository;
  }

  // ---- Public / customer-facing ----

  @Transactional(readOnly = true)
  public PagedResponse<ProductResponse> searchPublished(
      String search, Long categoryId, Long brandId,
      BigDecimal minPrice, BigDecimal maxPrice,
      int page, int size, String sort) {
    Pageable pageable = buildPageable(page, size, sort);
    Page<Product> result = productRepository.searchPublished(
        normalize(search), categoryId, brandId, minPrice, maxPrice, pageable);
    return PagedResponse.from(result.map(p -> toResponse(p, false)));
  }

  @Cacheable(value = "products", key = "#slug")
  @Transactional(readOnly = true)
  public ProductResponse getBySlug(String slug) {
    Product product = productRepository.findBySlug(slug)
        .filter(p -> p.getStatus() == Product.Status.PUBLISHED)
        .orElseThrow(() -> new ResourceNotFoundException("Product with slug " + slug));
    return toResponse(product, false);
  }

  // ---- Seller-scoped ----

  @Transactional(readOnly = true)
  public PagedResponse<ProductResponse> searchBySeller(
      Long sellerId, Product.Status status, String search, int page, int size, String sort) {
    Pageable pageable = buildPageable(page, size, sort);
    Page<Product> result = productRepository.searchBySeller(sellerId, status, normalize(search), pageable);
    return PagedResponse.from(result.map(p -> toResponse(p, true)));
  }

  @Transactional
  public ProductResponse create(Long sellerId, ProductRequest request) {
    if (productRepository.existsBySku(request.sku())) {
      throw new DuplicateResourceException("Product", "sku", request.sku());
    }
    if (productRepository.existsBySlug(slugify(request.name()))) {
      throw new DuplicateResourceException("Product", "slug", slugify(request.name()));
    }

    User seller = userRepository.findById(sellerId)
        .orElseThrow(() -> new ResourceNotFoundException("User", sellerId));

    Product product = new Product();
    product.setSeller(seller);
    applyRequest(product, request);
    product.setSlug(slugify(request.name()));
    productRepository.save(product);

    saveVariants(product, request);
    return toResponse(product, true);
  }

  @Transactional
  @CacheEvict(value = "products", key = "#slug")
  public ProductResponse update(Long productId, String slug, ProductRequest request) {
    Product product = getOwnedProduct(productId, slug);
    applyRequest(product, request);
    return toResponse(product, true);
  }

  @Transactional
  @CacheEvict(value = "products", key = "#slug")
  public ProductResponse addImage(Long productId, String slug, String url, String altText) {
    Product product = getOwnedProduct(productId, slug);

    ProductImage image = new ProductImage();
    image.setProduct(product);
    image.setUrl(url);
    image.setAltText(altText);

    List<ProductImage> existingImages = getImagesFromProduct(product);
    int currentImageCount = existingImages != null ? existingImages.size() : 0;
    image.setDisplayOrder(currentImageCount);
    productImageRepository.save(image);

    return toResponse(product, true);
  }

  @Transactional
  @CacheEvict(value = "products", key = "#slug")
  public void delete(Long productId, String slug) {
    Product product = getOwnedProduct(productId, slug);
    productRepository.delete(product);
  }

  // ---- Admin ----

  @Transactional(readOnly = true)
  public PagedResponse<ProductResponse> searchAll(
      Product.Status status, String search, int page, int size, String sort) {
    Pageable pageable = buildPageable(page, size, sort);
    Page<Product> result = productRepository.searchAll(status, normalize(search), pageable);
    return PagedResponse.from(result.map(p -> toResponse(p, true)));
  }

  // ---- Helpers ----

  @Transactional(readOnly = true)
  public Long resolveUserIdByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User with email " + email))
        .getId();
  }

  private Product getOwnedProduct(Long productId, String slug) {
    Product product = productRepository.findById(productId)
        .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
    if (!product.getSlug().equals(slug)) {
      throw new ResourceNotFoundException("Product", productId);
    }
    return product;
  }

  private void applyRequest(Product product, ProductRequest request) {
    product.setName(request.name()); // Fixed typo
    product.setDescription(request.description());
    product.setBasePrice(request.basePrice());
    product.setCostPrice(request.costPrice());
    product.setSku(request.sku());
    product.setStatus(request.status() == null
        ? Product.Status.DRAFT
        : Product.Status.valueOf(request.status()));

    if (request.brandId() != null) {
      Brand brand = brandRepository.findById(request.brandId())
          .orElseThrow(() -> new ResourceNotFoundException("Brand", request.brandId()));
      product.setBrand(brand);
    }
    if (request.categoryId() != null) {
      Category category = categoryRepository.findById(request.categoryId())
          .orElseThrow(() -> new ResourceNotFoundException("Category", request.categoryId()));
      product.setCategory(category);
    }
  }

  private void saveVariants(Product product, ProductRequest request) {
    if (request.variants() == null) {
      return;
    }
    for (ProductRequest.VariantRequest vr : request.variants()) {
      if (productVariantRepository.existsBySku(vr.sku())) {
        throw new DuplicateResourceException("Variant", "sku", vr.sku());
      }
      ProductVariant variant = new ProductVariant();
      variant.setProduct(product);
      variant.setSku(vr.sku());
      variant.setPriceOverride(vr.priceOverride());
      variant.setAttributesJson(vr.attributesJson() == null ? "{}" : vr.attributesJson());
      productVariantRepository.save(variant);
    }
  }

  private List<ProductImage> getImagesFromProduct(Product p) {
    return p.getImages() != null ? new ArrayList<>(p.getImages()) : null;
  }

  private ProductResponse toResponse(Product p, boolean includeCost) {
    List<ProductImage> rawImages = getImagesFromProduct(p);
    List<ProductResponse.ImageResponse> images = rawImages != null ? rawImages.stream()
        .map(i -> new ProductResponse.ImageResponse(i.getId(), i.getUrl(), i.getDisplayOrder(), i.getAltText()))
        .toList() : Collections.emptyList();

    List<ProductResponse.VariantResponse> variants = p.getVariants() != null ? p.getVariants().stream()
        .map(v -> new ProductResponse.VariantResponse(
            v.getId(), v.getSku(), v.getPriceOverride(), v.effectivePrice(), v.getAttributesJson()))
        .toList() : Collections.emptyList();

    return new ProductResponse(
        p.getId(),
        p.getName(),
        p.getSlug(),
        p.getDescription(),
        p.getBasePrice(),
        includeCost ? p.getCostPrice() : null,
        p.getSku(),
        p.getStatus().name(),
        p.getBrand() != null ? p.getBrand().getId() : null,
        p.getBrand() != null ? p.getBrand().getName() : null,
        p.getCategory() != null ? p.getCategory().getId() : null,
        p.getCategory() != null ? p.getCategory().getName() : null,
        p.getSeller() != null ? p.getSeller().getId() : null,
        p.getAverageRating(),
        p.getReviewCount(),
        images,
        variants,
        p.getCreatedAt());
  }

  private Pageable buildPageable(int page, int size, String sort) {
    int safePage = Math.max(page, 0);
    int safeSize = Math.min(Math.max(size, 1), 100);
    if (sort == null || sort.isBlank()) {
      return PageRequest.of(safePage, safeSize);
    }
    String[] parts = sort.split(",");
    String field = parts[0].trim();
    Sort.Direction direction = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc")
        ? Sort.Direction.DESC
        : Sort.Direction.ASC;
    return PageRequest.of(safePage, safeSize, Sort.by(direction, field));
  }

  private String normalize(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  private String slugify(String name) {
    String base = name.toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9]+", "-")
        .replaceAll("(^-|-$)", "");
    return base.isEmpty() ? "product-" + UUID.randomUUID().toString().substring(0, 8) : base;
  }
}