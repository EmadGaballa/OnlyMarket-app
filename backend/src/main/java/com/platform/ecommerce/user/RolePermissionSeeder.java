package com.platform.ecommerce.user;

import com.platform.ecommerce.user.domain.Permission;
import com.platform.ecommerce.user.domain.Role;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds roles and their permission mappings at application startup.
 *
 * <p>Idempotent — runs on every boot, finds-or-creates each role and
 * permission, and syncs the role-permission join table. This implements
 * Section 4's requirement that each role map to a fixed set of
 * permissions, checked via {@code @PreAuthorize("hasAuthority(...)")}
 * rather than role-name string comparisons.</p>
 */
@Component
public class RolePermissionSeeder implements CommandLineRunner {

  private static final Logger log = LoggerFactory.getLogger(RolePermissionSeeder.class);

  private final RoleRepository roleRepository;
  private final PermissionRepository permissionRepository;

  public RolePermissionSeeder(
      RoleRepository roleRepository, PermissionRepository permissionRepository) {
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
  }

  @Override
  @Transactional
  public void run(String... args) {
    Map<String, Permission> permissionByName = seedPermissions();
    seedRoles(permissionByName);
    log.info("RBAC roles and permissions seeded successfully");
  }

  private Map<String, Permission> seedPermissions() {
    return Arrays.stream(new String[] {
        Permissions.PRODUCT_CREATE,
        Permissions.PRODUCT_EDIT_OWN,
        Permissions.PRODUCT_EDIT_ANY,
        Permissions.PRODUCT_DELETE_OWN,
        Permissions.PRODUCT_DELETE_ANY,
        Permissions.PRODUCT_IMPORT,
        Permissions.CATEGORY_MANAGE,
        Permissions.BRAND_MANAGE,
        Permissions.INVENTORY_VIEW_OWN,
        Permissions.INVENTORY_VIEW_ANY,
        Permissions.INVENTORY_MANAGE_OWN,
        Permissions.INVENTORY_MANAGE_ANY,
        Permissions.WAREHOUSE_MANAGE,
        Permissions.ORDER_VIEW_OWN,
        Permissions.ORDER_VIEW_ANY,
        Permissions.ORDER_STATUS_UPDATE,
        Permissions.ORDER_CANCEL_OWN,
        Permissions.ORDER_REFUND_REQUEST,
        Permissions.ORDER_REFUND_APPROVE,
        Permissions.CART_MANAGE,
        Permissions.WISHLIST_MANAGE,
        Permissions.FAVORITES_MANAGE,
        Permissions.CHECKOUT,
        Permissions.COUPON_MANAGE_OWN,
        Permissions.COUPON_MANAGE_ANY,
        Permissions.REVIEW_CREATE,
        Permissions.REVIEW_EDIT_OWN,
        Permissions.REVIEW_DELETE_OWN,
        Permissions.REVIEW_MODERATE,
        Permissions.USER_VIEW_ANY,
        Permissions.USER_STATUS_UPDATE,
        Permissions.USER_ROLE_UPDATE,
        Permissions.USER_PASSWORD_RESET_ANY,
        Permissions.SELLER_APPROVE,
        Permissions.ANALYTICS_VIEW_OWN,
        Permissions.ANALYTICS_VIEW_ANY,
        Permissions.AUDIT_LOG_VIEW,
        Permissions.SETTINGS_MANAGE
    })
        .map(name -> permissionRepository.findByName(name)
            .orElseGet(() -> permissionRepository.save(new Permission(name))))
        .collect(Collectors.toMap(Permission::getName, p -> p));
  }

  private void seedRoles(Map<String, Permission> permissions) {
    // CUSTOMER
    seedRole("CUSTOMER", List.of(
        Permissions.CART_MANAGE,
        Permissions.WISHLIST_MANAGE,
        Permissions.FAVORITES_MANAGE,
        Permissions.CHECKOUT,
        Permissions.ORDER_VIEW_OWN,
        Permissions.ORDER_CANCEL_OWN,
        Permissions.REVIEW_CREATE,
        Permissions.REVIEW_EDIT_OWN,
        Permissions.REVIEW_DELETE_OWN
    ), permissions);

    // SELLER — everything a customer can do to their own account, plus
    // product/inventory/coupon/analytics scoped to their own data.
    seedRole("SELLER", List.of(
        Permissions.CART_MANAGE,
        Permissions.WISHLIST_MANAGE,
        Permissions.FAVORITES_MANAGE,
        Permissions.CHECKOUT,
        Permissions.ORDER_VIEW_OWN,
        Permissions.ORDER_CANCEL_OWN,
        Permissions.REVIEW_CREATE,
        Permissions.REVIEW_EDIT_OWN,
        Permissions.REVIEW_DELETE_OWN,
        Permissions.PRODUCT_CREATE,
        Permissions.PRODUCT_EDIT_OWN,
        Permissions.PRODUCT_DELETE_OWN,
        Permissions.INVENTORY_VIEW_OWN,
        Permissions.INVENTORY_MANAGE_OWN,
        Permissions.COUPON_MANAGE_OWN,
        Permissions.ANALYTICS_VIEW_OWN
    ), permissions);

    // SUPPORT — read access platform-wide, refund *requests* only.
    seedRole("SUPPORT", List.of(
        Permissions.ORDER_VIEW_ANY,
        Permissions.ORDER_STATUS_UPDATE,
        Permissions.ORDER_REFUND_REQUEST,
        Permissions.REVIEW_MODERATE,
        Permissions.USER_VIEW_ANY
    ), permissions);

    // ADMIN — full CRUD across every entity.
    seedRole("ADMIN", List.of(
        Permissions.PRODUCT_CREATE,
        Permissions.PRODUCT_EDIT_OWN,
        Permissions.PRODUCT_EDIT_ANY,
        Permissions.PRODUCT_DELETE_OWN,
        Permissions.PRODUCT_DELETE_ANY,
        Permissions.PRODUCT_IMPORT,
        Permissions.CATEGORY_MANAGE,
        Permissions.BRAND_MANAGE,
        Permissions.INVENTORY_VIEW_ANY,
        Permissions.INVENTORY_MANAGE_ANY,
        Permissions.WAREHOUSE_MANAGE,
        Permissions.ORDER_VIEW_ANY,
        Permissions.ORDER_STATUS_UPDATE,
        Permissions.ORDER_REFUND_REQUEST,
        Permissions.ORDER_REFUND_APPROVE,
        Permissions.COUPON_MANAGE_ANY,
        Permissions.REVIEW_MODERATE,
        Permissions.USER_VIEW_ANY,
        Permissions.USER_STATUS_UPDATE,
        Permissions.USER_ROLE_UPDATE,
        Permissions.USER_PASSWORD_RESET_ANY,
        Permissions.SELLER_APPROVE,
        Permissions.ANALYTICS_VIEW_ANY,
        Permissions.AUDIT_LOG_VIEW,
        Permissions.SETTINGS_MANAGE
    ), permissions);
  }

  private void seedRole(
      String roleName, List<String> permissionNames,
      Map<String, Permission> allPermissions) {
    Role role = roleRepository.findByName(roleName)
        .orElseGet(() -> roleRepository.save(new Role(roleName)));

    Set<Permission> permissions = permissionNames.stream()
        .map(allPermissions::get)
        .collect(Collectors.toSet());

    role.setPermissions(permissions);
    roleRepository.save(role);
  }
}