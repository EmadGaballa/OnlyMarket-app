package com.platform.ecommerce.common.dto;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Standard paginated response envelope for all list endpoints.
 *
 * @param <T> content item type
 */
public record PagedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages) {

  public static <T> PagedResponse<T> from(Page<T> page) {
    return new PagedResponse<>(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages());
  }

  public static <T> PagedResponse<T> of(
      List<T> content, int page, int size, long totalElements, int totalPages) {
    return new PagedResponse<>(content, page, size, totalElements, totalPages);
  }
}