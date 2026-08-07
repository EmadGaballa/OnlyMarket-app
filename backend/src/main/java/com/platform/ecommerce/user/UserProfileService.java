package com.platform.ecommerce.user;

import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.common.storage.StorageService;
import com.platform.ecommerce.user.domain.Address;
import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.user.dto.AddressRequest;
import com.platform.ecommerce.user.dto.AddressResponse;
import com.platform.ecommerce.user.dto.UpdateProfileRequest;
import java.io.IOException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * User self-service: profile updates, avatar upload, and address CRUD.
 * All methods are ownership-scoped by {@code userId} — a user can only
 * ever touch their own profile/addresses.
 */
@Service
public class UserProfileService {

  private final UserRepository userRepository;
  private final AddressRepository addressRepository;
  private final StorageService storageService;

  public UserProfileService(
      UserRepository userRepository,
      AddressRepository addressRepository,
      StorageService storageService) {
    this.userRepository = userRepository;
    this.addressRepository = addressRepository;
    this.storageService = storageService;
  }

  @Transactional(readOnly = true)
  public User getUser(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId));
  }

  @Transactional(readOnly = true)
  public User getUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User with email " + email));
  }

  @Transactional
  public User updateProfile(Long userId, UpdateProfileRequest request) {
    User user = getUser(userId);
    user.setFirstName(request.firstName());
    user.setLastName(request.lastName());
    user.setPhone(request.phone());
    return userRepository.save(user);
  }

  @Transactional
  public String uploadAvatar(Long userId, MultipartFile file) {
    User user = getUser(userId);
    try {
      String url = storageService.store(
          "avatars", file.getOriginalFilename(), file.getContentType(), file.getInputStream());
      user.setAvatarUrl(url);
      userRepository.save(user);
      return url;
    } catch (IOException e) {
      throw new IllegalStateException("Failed to read uploaded avatar", e);
    }
  }

  @Transactional(readOnly = true)
  public List<AddressResponse> listAddresses(Long userId) {
    return addressRepository.findByUserIdOrderByDefaultAddressDesc(userId).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public AddressResponse createAddress(Long userId, AddressRequest request) {
    User user = getUser(userId);
    Address address = new Address();
    address.setUser(user);
    applyRequest(address, request);

    if (request.isDefault()) {
      clearDefaultFlag(userId);
    } else if (addressRepository.findByUserIdOrderByDefaultAddressDesc(userId).isEmpty()) {
      address.setDefaultAddress(true);
    }

    return toResponse(addressRepository.save(address));
  }

  @Transactional
  public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
    Address address = addressRepository.findByIdAndUserId(addressId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
    applyRequest(address, request);

    if (request.isDefault()) {
      clearDefaultFlag(userId);
      address.setDefaultAddress(true);
    }

    return toResponse(addressRepository.save(address));
  }

  @Transactional
  public void deleteAddress(Long userId, Long addressId) {
    Address address = addressRepository.findByIdAndUserId(addressId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
    addressRepository.delete(address);
  }

  private void applyRequest(Address address, AddressRequest request) {
    address.setLabel(request.label());
    address.setLine1(request.line1());
    address.setLine2(request.line2());
    address.setCity(request.city());
    address.setState(request.state());
    address.setPostalCode(request.postalCode());
    address.setCountry(request.country());
    address.setDefaultAddress(request.isDefault());
  }

  private void clearDefaultFlag(Long userId) {
    addressRepository.findByUserIdOrderByDefaultAddressDesc(userId)
        .forEach(a -> {
          if (a.isDefaultAddress()) {
            a.setDefaultAddress(false);
            addressRepository.save(a);
          }
        });
  }

  private AddressResponse toResponse(Address a) {
    return new AddressResponse(
        a.getId(), a.getLabel(), a.getLine1(), a.getLine2(), a.getCity(),
        a.getState(), a.getPostalCode(), a.getCountry(), a.isDefaultAddress());
  }
}