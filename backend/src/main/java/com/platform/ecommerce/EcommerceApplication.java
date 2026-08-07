package com.platform.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Entry point for the Enterprise E-Commerce Platform backend.
 *
 * <p>Boots Spring Boot 3 / Java 21 application with async job support
 * (DummyJSON product import) and Redis-backed caching enabled.</p>
 */
@SpringBootApplication
@EnableAsync
@EnableCaching
public class EcommerceApplication {

  public static void main(String[] args) {
    SpringApplication.run(EcommerceApplication.class, args);
  }
}