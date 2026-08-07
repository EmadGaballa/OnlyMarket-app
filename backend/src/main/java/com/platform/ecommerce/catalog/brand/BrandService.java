package com.platform.ecommerce.catalog.brand;

import com.platform.ecommerce.catalog.brand.domain.Brand;
import com.platform.ecommerce.common.exception.DuplicateResourceException;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Brand CRUD operations. */
@Service
public class BrandService {

  private final BrandRepository brandRepository;

  public BrandService(BrandRepository brandRepository) {
    this.brandRepository = brandRepository;
  }

  @Transactional(readOnly = true)
  public List<Brand> listAll() {
    return brandRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Brand getById(Long id) {
    return brandRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Brand", id));
  }

  @Transactional
  public Brand create(BrandRequest request) {
    if (brandRepository.existsByName(request.name())) {
      throw new DuplicateResourceException("Brand", "name", request.name());
    }
    Brand brand = new Brand(request.name());
    return brandRepository.save(brand);
  }

  @Transactional
  public Brand update(Long id, BrandRequest request) {
    Brand brand = getById(id);
    brand.setName(request.name());
    return brandRepository.save(brand);
  }

  @Transactional
  public void delete(Long id) {
    Brand brand = getById(id);
    brandRepository.delete(brand);
  }
}