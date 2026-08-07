package com.platform.ecommerce.user;

import com.platform.ecommerce.user.domain.Address;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Address}. */
public interface AddressRepository extends JpaRepository<Address, Long> {

  List<Address> findByUserIdOrderByDefaultAddressDesc(Long userId);

  Optional<Address> findByIdAndUserId(Long id, Long userId);

  boolean existsByIdAndUserId(Long id, Long userId);
}