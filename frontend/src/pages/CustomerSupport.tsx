import React from "react";
import styles from "./CustomerSupport.module.css";

export default function CustomerSupport() {
  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <header className={styles.hero}>
        <h1>Customer Support</h1>
        <p>
          Find answers to common questions, shipping details, and privacy
          policies.
        </p>
      </header>

      {/* Navigation Quick Jump Bar */}
      <nav className={styles.quickNav}>
        <a href="#help">Help & FAQ</a>
        <a href="#shipping">Shipping & Returns</a>
        <a href="#privacy">Privacy Policy</a>
      </nav>

      <main className={styles.content}>
        {/* ==================== 1. HELP & FAQ SECTION ==================== */}
        <section id="help" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Help & Frequently Asked Questions</h2>
            <p>
              Everything you need to know about our products and ordering
              process.
            </p>
          </div>

          <div className={styles.faqGrid}>
            <div className={styles.faqCard}>
              <h3>How do I track my order?</h3>
              <p>
                Once your order ships, you will receive a confirmation email
                containing your tracking number and a link to view real-time
                shipping updates.
              </p>
            </div>

            <div className={styles.faqCard}>
              <h3>What payment methods do you accept?</h3>
              <p>
                We accept all major credit/debit cards (Visa, MasterCard,
                American Express), Apple Pay, Google Pay, and PayPal.
              </p>
            </div>

            <div className={styles.faqCard}>
              <h3>Can I modify or cancel my order after placing it?</h3>
              <p>
                Orders are processed quickly to ensure fast delivery. If you
                need to request changes, please contact support within 1 hour of
                purchase.
              </p>
            </div>

            <div className={styles.faqCard}>
              <h3>How can I reach customer service?</h3>
              <p>
                Our support team is available Monday through Friday, 9:00 AM –
                6:00 PM EST. Email us at <strong>support@onlymarket.com</strong>
                .
              </p>
            </div>
          </div>
        </section>

        <hr className={styles.divider} />

        {/* ==================== 2. SHIPPING & RETURNS SECTION ==================== */}
        <section id="shipping" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Shipping & Returns Policy</h2>
            <p>
              Clear details on dispatch timelines, shipping options, and
              hassle-free returns.
            </p>
          </div>

          <div className={styles.infoBlock}>
            <h3>Shipping Information</h3>
            <ul>
              <li>
                <strong>Standard Shipping:</strong> 3–5 business days ($7.99, or
                free on orders over $75).
              </li>
              {/* <li>
                <strong>Express Shipping:</strong> 1–2 business days ($14.99).
              </li> */}
              <li>
                <strong>International Shipping:</strong> 7–14 business days
                depending on customs processing ($7.99, or free on orders over
                $75).
              </li>
            </ul>
          </div>

          <div className={styles.infoBlock}>
            <h3>30-Day Return & Exchange Policy</h3>
            <p>
              If you are not satisfied with your purchase, you can return
              unworn, undamaged items in their original packaging within{" "}
              <strong>30 days of delivery</strong> for a full refund or
              exchange.
            </p>
            <h4>Return Steps:</h4>
            <ol className={styles.orderedList}>
              <li>Package your item securely in its original box.</li>
              <li>
                Attach the pre-paid shipping label provided with your order
                receipt.
              </li>
              <li>Drop off the package at any authorized carrier location.</li>
            </ol>
            <p className={styles.note}>
              <em>
                Note: Return shipping costs are deducted from the refund unless
                the item arrived defective or incorrect.
              </em>
            </p>
          </div>
        </section>

        <hr className={styles.divider} />

        {/* ==================== 3. PRIVACY POLICY SECTION ==================== */}
        <section id="privacy" className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Privacy Policy</h2>
            <p>
              Last updated: August 2026. How we collect, use, and protect your
              personal information.
            </p>
          </div>

          <div className={styles.textBlock}>
            <h3>Information We Collect</h3>
            <p>
              We collect information you provide directly when placing an order,
              creating an account, or subscribing to our newsletter. This
              includes your name, email address, shipping address, and encrypted
              payment details.
            </p>

            <h3>How We Use Your Data</h3>
            <p>
              Your data is exclusively used to fulfill orders, process payments,
              prevent fraud, and send transactional updates. We never sell your
              personal information to third parties.
            </p>

            <h3>Data Security & Cookies</h3>
            <p>
              We utilize 256-bit SSL encryption and strict industry protocols to
              safeguard your personal data. Essential cookies are used to
              maintain store functionality and retain cart contents.
            </p>

            <h3>Your Rights</h3>
            <p>
              You have the right to request access to, correction of, or
              complete deletion of your personal data at any time by contacting
              our privacy compliance officer at{" "}
              <strong>support@onlymarket.com</strong>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
