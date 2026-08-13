import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users";
import { couponsApi } from "../api/coupons";
import { useCart } from "../hooks/useCart";
import { usePlaceOrder } from "../hooks/usePlaceOrder";
import { useToast } from "../context/ToastContext";
import { getApiErrorMessage } from "../utils/cartCache";
import {
  formatCardNumber,
  luhnCheck,
  detectCardBrand,
  isExpiryValid,
  isCvvValid,
} from "../utils/payment";
import type { CardBrand } from "../types/payment";
import type { AddressRequest } from "../types/auth";
import styles from "./CheckoutPage.module.css";

const EMPTY_ADDRESS: AddressRequest = {
  label: "Home",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  isDefault: false,
};

export default function CheckoutPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { data: cart, isLoading: cartLoading } = useCart();
  const placeOrder = usePlaceOrder();
  const {
    data: addresses,
    isLoading: addressesLoading,
    refetch: refetchAddresses,
  } = useQuery({ queryKey: ["addresses"], queryFn: usersApi.listAddresses });

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotal ?? 0;

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<AddressRequest>(EMPTY_ADDRESS);
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<
    "CARD" | "CASH_ON_DELIVERY"
  >("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [placed, setPlaced] = useState(false);

  const cardBrand: CardBrand | null = useMemo(
    () => detectCardBrand(cardNumber),
    [cardNumber],
  );
  const expiryMonth = expiry.split("/")[0] ?? "";
  const expiryYear = expiry.split("/")[1] ?? "";

  const addressValid = selectedAddressId !== null;
  const cardValid =
    paymentMethod === "CASH_ON_DELIVERY" ||
    (luhnCheck(cardNumber) &&
      cardholderName.trim().length > 0 &&
      isExpiryValid(expiryMonth, expiryYear) &&
      isCvvValid(cvv));
  const canPlaceOrder =
    addressValid && cardValid && items.length > 0 && !placeOrder.isPending;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);

  const handleExpiryInput = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setExpiry(
      digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`,
    );
  };

  const handleSetNewAddress = (
    field: keyof AddressRequest,
    value: string | boolean,
  ) => setNewAddress((prev) => ({ ...prev, [field]: value }));

  const saveNewAddress = async () => {
    setSavingAddress(true);
    try {
      const saved = await usersApi.addAddress(newAddress);
      setSelectedAddressId(saved.id);
      setShowNewAddress(false);
      setNewAddress(EMPTY_ADDRESS);
      refetchAddresses();
      showToast({ type: "success", message: "Address saved." });
    } catch (error) {
      showToast({
        type: "error",
        message: getApiErrorMessage(error, "Failed to save address."),
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const result = await couponsApi.validateCoupon(code, subtotal);
      setAppliedCoupon({
        code: result.code,
        discountAmount: result.discountAmount,
      });
      showToast({ type: "success", message: `Coupon ${result.code} applied.` });
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError(getApiErrorMessage(error, "Invalid coupon code."));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const freeShippingThreshold = 75;
  const shippingFee =
    subtotal >= freeShippingThreshold || items.length === 0 ? 0 : 7.99;
  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(subtotal + shippingFee - discount, 0);

  const handlePlaceOrder = () => {
    if (!canPlaceOrder) return;
    placeOrder.mutate(
      {
        addressId: selectedAddressId ?? undefined,
        paymentMethod,
        ...(paymentMethod === "CARD"
          ? {
              cardNumber,
              cardholderName,
              expiryMonth: Number(expiryMonth),
              expiryYear: (() => {
                const y = Number(expiryYear);
                return Number.isFinite(y)
                  ? y < 100
                    ? 2000 + y
                    : y
                  : undefined;
              })(),
              cvv,
            }
          : {}),
        couponCode: appliedCoupon?.code,
      },
      {
        onSuccess: () => {
          setPlaced(true);
          showToast({
            type: "success",
            message: "Order placed! Your order is being prepared.",
          });
        },
      },
    );
  };

  if (placed) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckIcon />
          </div>
          <h1>Order placed!</h1>
          <p className={styles.orderSuccessTxt}>
            Your order is being prepared. You can track it from your profile.
          </p>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate("/profile")}
          >
            View my orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.headerGroup}>
        <h1>Checkout</h1>
        <p className={styles.subtitle}>
          Choose a delivery address and payment method.
        </p>
      </header>
      <div className={styles.grid}>
        <div className={styles.mainCol}>
          {" "}
          <section className={styles.card}>
            <h2>Delivery Address</h2>
            {addressesLoading ? (
              <p className={styles.muted}>Loading addresses…</p>
            ) : (addresses ?? []).length === 0 && !showNewAddress ? (
              <p className={styles.muted}>No saved addresses yet.</p>
            ) : (
              <div className={styles.addressList}>
                {(addresses ?? []).map((addr) => (
                  <label key={addr.id} className={styles.addressOption}>
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      disabled={savingAddress}
                    />
                    <span className={styles.addressLabel}>{addr.label}</span>
                    <span className={styles.addressDetail}>
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                      {addr.state} {addr.postalCode}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {!showNewAddress ? (
              <button
                type="button"
                className={styles.btnLink}
                onClick={() => setShowNewAddress(true)}
              >
                + Add a new address
              </button>
            ) : (
              <div className={styles.addressForm}>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="Label (Home, Work…)"
                    value={newAddress.label}
                    onChange={(e) =>
                      handleSetNewAddress("label", e.target.value)
                    }
                    className={styles.textInput}
                  />
                  <input
                    type="text"
                    placeholder="Address line 1"
                    value={newAddress.line1}
                    onChange={(e) =>
                      handleSetNewAddress("line1", e.target.value)
                    }
                    className={styles.textInput}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address line 2 (optional)"
                  value={newAddress.line2}
                  onChange={(e) => handleSetNewAddress("line2", e.target.value)}
                  className={styles.textInput}
                />
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) =>
                      handleSetNewAddress("city", e.target.value)
                    }
                    className={styles.textInput}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) =>
                      handleSetNewAddress("state", e.target.value)
                    }
                    className={styles.textInput}
                  />
                </div>
                <div className={styles.formRow}>
                  <input
                    type="text"
                    placeholder="Postal code"
                    value={newAddress.postalCode}
                    onChange={(e) =>
                      handleSetNewAddress("postalCode", e.target.value)
                    }
                    className={styles.textInput}
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={newAddress.country}
                    onChange={(e) =>
                      handleSetNewAddress("country", e.target.value)
                    }
                    className={styles.textInput}
                  />
                </div>
                <div className={styles.formRow}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setShowNewAddress(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={() => saveNewAddress()}
                    disabled={savingAddress}
                  >
                    {savingAddress ? "Saving…" : "Save Address"}
                  </button>
                </div>
              </div>
            )}
            {!addressValid && (
              <p className={styles.fieldError} role="alert">
                Please select a delivery address.
              </p>
            )}
          </section>
          <section className={styles.card}>
            <h2>Payment Method</h2>
            <div className={styles.radioGroup}>
              <label className={styles.paymentOption}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={paymentMethod === "CARD"}
                  onChange={() => setPaymentMethod("CARD")}
                />
                Card
              </label>
              <label className={styles.paymentOption}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH_ON_DELIVERY"
                  checked={paymentMethod === "CASH_ON_DELIVERY"}
                  onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                />
                Cash on Delivery
              </label>
            </div>
            {paymentMethod === "CARD" && (
              <div className={styles.cardForm}>
                <div className={styles.cardField}>
                  <label htmlFor="cardNumber">Card number</label>
                  <input
                    id="cardNumber"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(formatCardNumber(e.target.value))
                    }
                    className={styles.textInput}
                    maxLength={19}
                  />
                  {cardBrand && (
                    <span className={styles.brandBadge}>{cardBrand}</span>
                  )}
                </div>
                <div className={styles.formRow}>
                  <div className={styles.cardField}>
                    <label htmlFor="cardholderName">Name on card</label>
                    <input
                      id="cardholderName"
                      type="text"
                      placeholder="John A. Doe"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                  <div className={styles.cardField}>
                    <label htmlFor="expiry">Expiry</label>
                    <input
                      id="expiry"
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => handleExpiryInput(e.target.value)}
                      className={styles.textInput}
                      maxLength={5}
                    />
                  </div>
                  <div className={styles.cardField}>
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                      }
                      className={styles.textInput}
                      maxLength={4}
                    />
                  </div>
                </div>
                {!cardValid && (
                  <p className={styles.fieldError} role="alert">
                    Please enter a valid card number, expiry and CVV.
                  </p>
                )}
              </div>
            )}
          </section>
          <section className={styles.card}>
            <h2>Have a coupon?</h2>
            <div className={styles.couponRow}>
              <input
                type="text"
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  setCouponError(null);
                }}
                className={styles.textInput}
              />
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => applyCoupon()}
                disabled={!couponInput.trim() || validatingCoupon}
              >
                {validatingCoupon ? "Applying…" : "Apply"}
              </button>
            </div>
            {appliedCoupon ? (
              <p className={styles.couponApplied}>
                {appliedCoupon.code} applied: −
                {formatPrice(appliedCoupon.discountAmount)}
              </p>
            ) : couponError ? (
              <p className={styles.fieldError} role="alert">
                {couponError}
              </p>
            ) : null}
          </section>
          <section className={styles.card}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => handlePlaceOrder()}
              disabled={!canPlaceOrder}
            >
              {placeOrder.isPending
                ? "Placing order…"
                : `Place Order — ${formatPrice(total)}`}
            </button>
          </section>
        </div>
        <aside className={styles.summaryCol}>
          {" "}
          <h2>Order Summary</h2>
          {cartLoading ? (
            <p className={styles.muted}>Loading your cart…</p>
          ) : items.length === 0 ? (
            <p className={styles.muted}>Your cart is empty.</p>
          ) : (
            <ul className={styles.summaryList}>
              {items.map((item) => (
                <li key={item.id} className={styles.summaryItem}>
                  <span className={styles.summaryItemName}>
                    {item.productName}
                    {item.variantName ? ` — ${item.variantName}` : ""}
                  </span>
                  <span className={styles.summaryItemQty}>
                    ×{item.quantity}
                  </span>
                  <span className={styles.summaryItemPrice}>
                    {formatPrice(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.summaryLine}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span>Shipping</span>
            <span>{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</span>
          </div>
          {appliedCoupon && (
            <div className={styles.summaryLine}>
              <span>Discount ({appliedCoupon.code})</span>
              <span>−{formatPrice(appliedCoupon.discountAmount)}</span>
            </div>
          )}
          <div className={`${styles.summaryLine} ${styles.summaryTotal}`}>
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
