package com.platform.ecommerce.catalog.brand.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Product brand (e.g. "Apple", "Samsung"). */
@Entity
@Table(name = "brands")
@Getter
@Setter
@NoArgsConstructor
public class Brand {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 150)
  private String name;

  @Column(name = "external_id")
  private Long externalId;

  public Brand(String name) {
    this.name = name;
  }
}