package com.platform.ecommerce.order.domain;

/** Card brand derived from the card number's leading digits (BIN-range detection). */
public enum CardBrand {
  VISA,
  MASTERCARD,
  AMEX
}