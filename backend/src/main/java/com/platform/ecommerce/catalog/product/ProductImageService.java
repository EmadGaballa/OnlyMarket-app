package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.common.storage.StorageService;
import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Handles product image uploads via the {@link StorageService} abstraction.
 * Uploaded filenames are never used as store paths (Section 9.5).
 */
@Service
public class ProductImageService {

  private final StorageService storageService;

  public ProductImageService(StorageService storageService) {
    this.storageService = storageService;
  }

  public String storeImage(Long productId, MultipartFile file) {
    if (productId == null) {
      throw new ResourceNotFoundException("Product", "null");
    }
    try {
      return storageService.store(
          "products/" + productId,
          file.getOriginalFilename(),
          file.getContentType(),
          file.getInputStream());
    } catch (IOException e) {
      throw new IllegalStateException("Failed to read uploaded product image", e);
    }
  }
}