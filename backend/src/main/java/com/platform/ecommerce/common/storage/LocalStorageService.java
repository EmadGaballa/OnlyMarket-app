package com.platform.ecommerce.common.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * v1 local-filesystem {@link StorageService} implementation.
 */
@Service
public class LocalStorageService implements StorageService {

  private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

  private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
      "image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml");

  private final Path uploadRoot;

  public LocalStorageService(@Value("${app.upload.dir}") String uploadDir) {
    this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    try {
      Files.createDirectories(uploadRoot);
    } catch (IOException e) {
      throw new IllegalStateException("Cannot create upload directory: " + uploadRoot, e);
    }
  }

  @Override
  public String store(
      String container, String originalFilename, String contentType, InputStream data) {
    if (contentType == null) {
      throw new IllegalArgumentException("Content-Type cannot be null");
    }

    String normalizedType = contentType.toLowerCase(Locale.ROOT).split(";")[0].trim();
    if (!ALLOWED_CONTENT_TYPES.contains(normalizedType)) {
      throw new IllegalArgumentException(
          "File type not allowed: " + contentType + " (allowed: image/jpeg, png, webp, gif, svg)");
    }

    Path containerDir = uploadRoot.resolve(container).normalize();
    if (!containerDir.startsWith(uploadRoot)) {
      throw new IllegalArgumentException("Invalid container path");
    }

    try {
      Files.createDirectories(containerDir);
      String extension = extensionFor(normalizedType);
      String filename = UUID.randomUUID() + extension;
      Path target = containerDir.resolve(filename);
      Files.copy(data, target, StandardCopyOption.REPLACE_EXISTING);
      String url = "/uploads/" + container + "/" + filename;
      log.debug("Stored file {} ({})", url, contentType);
      return url;
    } catch (IOException e) {
      throw new IllegalStateException("Failed to store file", e);
    }
  }

  @Override
  public void delete(String url) {
    if (url == null) {
      return;
    }

    // Support both relative paths (/uploads/...) and absolute URLs (http://.../uploads/...)
    int uploadsIdx = url.indexOf("/uploads/");
    if (uploadsIdx == -1) {
      return;
    }

    String relativePath = url.substring(uploadsIdx + "/uploads/".length());
    try {
      Path file = uploadRoot.resolve(relativePath).normalize();
      if (file.startsWith(uploadRoot)) {
        Files.deleteIfExists(file);
      }
    } catch (IOException e) {
      log.warn("Failed to delete stored file {}", url, e);
    }
  }

  private String extensionFor(String normalizedType) {
    return switch (normalizedType) {
      case "image/jpeg" -> ".jpg";
      case "image/png" -> ".png";
      case "image/webp" -> ".webp";
      case "image/gif" -> ".gif";
      case "image/svg+xml" -> ".svg";
      default -> "";
    };
  }
}