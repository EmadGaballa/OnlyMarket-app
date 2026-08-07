package com.platform.ecommerce.notification;

/**
 * Mail delivery abstraction. v1 ships a {@link ConsoleMailService} logging
 * implementation; production can swap in SES/SendGrid implementations
 * without touching calling code (Section 1.1).
 */
public interface MailService {

  /**
   * Send a plain-text/HTML email.
   *
   * @param to recipient address
   * @param subject email subject
   * @param htmlBody HTML body
   */
  void send(String to, String subject, String htmlBody);
}