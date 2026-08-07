package com.platform.ecommerce.favorite;

import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.favorite.domain.Favorite;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Favorite operations scoped to the authenticated user. */
@Service
public class FavoriteService {

  private final FavoriteRepository favoriteRepository;
  private final UserRepository userRepository;

  public FavoriteService(FavoriteRepository favoriteRepository, UserRepository userRepository) {
    this.favoriteRepository = favoriteRepository;
    this.userRepository = userRepository;
  }

  @Transactional(readOnly = true)
  public List<Favorite> listFavorites(Long userId) {
    return favoriteRepository.findByUserId(userId);
  }

  @Transactional
  public Favorite addFavorite(Long userId, Long productId) {
    User user = new User();
    user.setId(userId);
    Product product = new Product();
    product.setId(productId);

    return favoriteRepository.findByUserIdAndProductId(userId, productId)
        .orElseGet(() -> {
          Favorite favorite = new Favorite();
          favorite.setUser(user);
          favorite.setProduct(product);
          return favoriteRepository.save(favorite);
        });
  }

  @Transactional
  public void removeFavorite(Long userId, Long productId) {
    favoriteRepository.findByUserIdAndProductId(userId, productId)
        .ifPresent(favoriteRepository::delete);
  }

  @Transactional(readOnly = true)
  public Long resolveUserIdByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User with email " + email))
        .getId();
  }
}