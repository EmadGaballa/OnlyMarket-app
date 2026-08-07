package com.platform.ecommerce.user;

import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.user.domain.UserStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Data access for {@link User}. */
public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  @Query("""
      SELECT u FROM User u
      WHERE (:status IS NULL OR u.status = :status)
        AND (:roleName IS NULL OR EXISTS (
              SELECT r FROM u.roles r WHERE r.name = :roleName))
      """)
  Page<User> search(
      @Param("status") UserStatus status,
      @Param("roleName") String roleName,
      Pageable pageable);
}