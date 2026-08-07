package com.platform.ecommerce.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A fine-grained permission (e.g. {@code PRODUCT_CREATE},
 * {@code ORDER_REFUND_APPROVE}). Roles map to a fixed set of permissions;
 * {@code @PreAuthorize} checks reference permission names, not role names.
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
public class Permission {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, unique = true, length = 100)
  private String name;

  public Permission(String name) {
    this.name = name;
  }
}