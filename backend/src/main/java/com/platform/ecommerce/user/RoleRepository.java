package com.platform.ecommerce.user;

import com.platform.ecommerce.user.domain.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Role}. */
public interface RoleRepository extends JpaRepository<Role, Long> {

  Optional<Role> findByName(String name);

  boolean existsByName(String name);
}