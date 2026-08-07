package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.brand.BrandRepository;
import com.platform.ecommerce.catalog.brand.domain.Brand;
import com.platform.ecommerce.catalog.category.CategoryRepository;
import com.platform.ecommerce.catalog.category.domain.Category;
import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.catalog.product.domain.ProductImage;
import com.platform.ecommerce.catalog.variant.ProductVariantRepository;
import com.platform.ecommerce.catalog.variant.domain.ProductVariant;
import com.platform.ecommerce.common.storage.StorageService;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-time DummyJSON product import (Section 6). Runs as a background
 * job; status is stored in Redis so the admin UI can poll it.
 */
@Service
public class ProductImportService {

  private static final String JOB_PREFIX = "import:job:";

  private final ProductRepository productRepository;
  private final ProductImageRepository productImageRepository;
  private final ProductVariantRepository productVariantRepository;
  private final BrandRepository brandRepository;
  private final CategoryRepository categoryRepository;
  private final UserRepository userRepository;
  private final StorageService storageService;
  private final RedisTemplate<String, Object> redisTemplate;
  private final ObjectMapper objectMapper;

  @Value("${app.import.dummyjson-url:https://dummyjson.com/products?limit=0}")
  private String dummyJsonUrl;

  public ProductImportService(
      ProductRepository productRepository,
      ProductImageRepository productImageRepository,
      ProductVariantRepository productVariantRepository,
      BrandRepository brandRepository,
      CategoryRepository categoryRepository,
      UserRepository userRepository,
      StorageService storageService,
      RedisTemplate<String, Object> redisTemplate,
      ObjectMapper objectMapper) {
    this.productRepository = productRepository;
    this.productImageRepository = productImageRepository;
    this.productVariantRepository = productVariantRepository;
    this.brandRepository = brandRepository;
    this.categoryRepository = categoryRepository;
    this.userRepository = userRepository;
    this.storageService = storageService;
    this.redisTemplate = redisTemplate;
    this.objectMapper = objectMapper;
  }

  public String startImport() {
    String jobId = "job-" + Instant.now().toEpochMilli();
    setStatus(jobId, "PENDING", 0, null);
    runAsync(jobId);
    return jobId;
  }

  @Async
  public void runAsync(String jobId) {
    try {
      setStatus(jobId, "RUNNING", 0, "Fetching product catalog");
      JsonNode root = fetchDummyJson();
      int total = root.path("products").size();
      int processed = 0;

      User platformUser = userRepository.findAll().stream().findFirst()
          .orElseThrow(() -> new IllegalStateException("No users exist to own imported products"));

      for (JsonNode node : root.path("products")) {
        try {
          importProduct(node, platformUser);
        } catch (Exception e) {
          // skip individual failures
        }
        processed++;
        int pct = (int) ((double) processed / total * 100);
        setStatus(jobId, "RUNNING", pct, "Imported " + processed + "/" + total);
      }
      setStatus(jobId, "COMPLETED", 100, "Imported " + processed + " products");
    } catch (Exception e) {
      setStatus(jobId, "FAILED", 0, e.getMessage());
    }
  }

  @Transactional
  public void importProduct(JsonNode node, User platformUser) {
    Long externalId = node.path("id").asLong();
    if (productRepository.findByExternalId(externalId).isPresent()) {
      return; // idempotent
    }

    String brandName = node.path("brand").asText(null);
    Brand brand = null;
    if (brandName != null && !brandName.isBlank()) {
      brand = brandRepository.findByName(brandName)
          .orElseGet(() -> brandRepository.save(new Brand(brandName)));
    }

    String categoryName = node.path("category").asText(null);
    Category category = null;
    if (categoryName != null && !categoryName.isBlank()) {
      String slug = categoryName.toLowerCase().replaceAll("[^a-z0-9]+", "-");
      category = categoryRepository.findBySlug(slug)
          .orElseGet(() -> categoryRepository.save(new Category(categoryName, slug)));
    }

    Product product = new Product();
    product.setSeller(platformUser);
    product.setBrand(brand);
    product.setCategory(category);
    product.setName(node.path("title").asText());
    product.setSlug("product-" + externalId);
    product.setDescription(node.path("description").asText());
    product.setBasePrice(new BigDecimal(node.path("price").asText()));
    product.setSku("DJ-" + externalId);
    product.setStatus(Product.Status.PUBLISHED);
    product.setExternalId(externalId);
    product.setAverageRating(new BigDecimal(node.path("rating").asText("0")));
    product.setReviewCount(node.path("stock").isInt() ? node.path("stock").asInt() : 0);
    productRepository.save(product);

    // Default variant
    ProductVariant variant = new ProductVariant();
    variant.setProduct(product);
    variant.setSku(product.getSku());
    variant.setAttributesJson("{}");
    productVariantRepository.save(variant);

    // Images
    for (JsonNode img : node.path("images")) {
      try {
        String url = storageService.store(
            "products/" + product.getId(),
            img.asText(),
            "image/jpeg",
            fetchStream(img.asText()));
        ProductImage pi = new ProductImage();
        pi.setProduct(product);
        pi.setUrl(url);
        pi.setDisplayOrder(0);
        productImageRepository.save(pi);
      } catch (Exception e) {
        // skip failed image
      }
    }
  }

  public String getStatus(String jobId) {
    Object raw = redisTemplate.opsForValue().get(JOB_PREFIX + jobId);
    return raw != null ? raw.toString() : null;
  }

  private void setStatus(String jobId, String status, int progress, String message) {
    String value = status + "|" + progress + "|" + (message == null ? "" : message);
    redisTemplate.opsForValue().set(JOB_PREFIX + jobId, value);
  }

  private JsonNode fetchDummyJson() throws Exception {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    ClientHttpRequest request = factory.createRequest(new java.net.URI(dummyJsonUrl), HttpMethod.GET);
    try (ClientHttpResponse response = request.execute()) {
      return objectMapper.readTree(response.getBody());
    }
  }

  private InputStream fetchStream(String url) throws Exception {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    ClientHttpRequest request = factory.createRequest(new java.net.URI(url), HttpMethod.GET);
    ClientHttpResponse response = request.execute();
    return response.getBody();
  }
}