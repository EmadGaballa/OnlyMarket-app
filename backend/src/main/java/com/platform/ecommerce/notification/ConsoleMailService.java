package com.platform.ecommerce.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * v1 mail implementation that logs emails to the console (Section 1.1).
 * Swappable for SES/SendGrid without affecting callers.
 */
@Service
public class ConsoleMailService implements MailService {

  private static final Logger log = LoggerFactory.getLogger(ConsoleMailService.class);

  @Override
  public void send(String to, String subject, String htmlBody) {
    log.info("""
        ============ EMAIL (SIMULATED) ============
        To:      {}
        Subject: {}
        Body:
        {}
        ===========================================""",
        to, subject, htmlBody);
  }
}