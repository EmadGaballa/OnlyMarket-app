package com.platform.ecommerce.common.storage;

import java.io.InputStream;

/**
 * File storage abstraction. v1 ships {@link LocalStorageService}; an
 * S3-compatible implementation can be swapped in without touching calling
 * code (Section 2 & 10 of the spec).
 */
public interface StorageService {

  /**
   * Store a file and return its public URL.
   *
   * @param container logical sub-folder (e.g. "avatars", "products", "imports")
   * @param originalFilename original filename from the client (used only as metadata)
   * @param contentType MIME type
   * @param data file contents
   * @return public URL of the stored file
   */
  String store(String container, String originalFilename, String contentType, InputStream data);

  /** Delete a stored file by its URL. */
  void delete(String url);

  /** Resolve a public URL to a local filesystem path (v1 local impl). */
  default String resolvePath(String url) {
    return url;
  }
}