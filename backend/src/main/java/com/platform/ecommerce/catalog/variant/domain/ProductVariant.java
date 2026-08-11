package com.platform.ecommerce.catalog.variant.domain;

import com.platform.ecommerce.catalog.product.domain.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A specific purchasable SKU-variant of a product (e.g. "Blue / Large").
 * {@code attributesJson} stores attribute-value pairs as JSONB.
 */
@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
public class ProductVariant {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "product_id", nullable = false)
  private Product product;

  @Column(nullable = false, unique = true, length = 100)
  private String sku;

  @Column(name = "price_override", precision = 12, scale = 2)
  private BigDecimal priceOverride;

  /** Available units for sale. {@code null} means stock is not tracked for this variant. */
  @Column(name = "stock_quantity")
  private Integer stockQuantity;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "attributes_json", nullable = false, columnDefinition = "jsonb")
  private String attributesJson = "{}";

  /** Effective price: variant override if present, else product base price. */
  public BigDecimal effectivePrice() {
    return priceOverride != null ? priceOverride : product.getBasePrice();
  }
}