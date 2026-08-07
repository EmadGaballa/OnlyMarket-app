package com.platform.ecommerce.user;

import com.platform.ecommerce.user.domain.Permission;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Permission}. */
public interface PermissionRepository extends JpaRepository<Permission, Long> {

  Optional<Permission> findByName(String name);

  boolean existsByName(String name);
}