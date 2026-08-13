/** Card brand detected from the card number's leading digits. */
export type CardBrand = "VISA" | "MASTERCARD" | "AMEX";

/** Client-side card form shape used on the checkout page. */
export interface CardFormState {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}
