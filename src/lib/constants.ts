export const PAYMENT_METHODS = {
  COD: "Cash on Delivery",
  BANK_DEPOSIT: "Bank Deposit",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const DEFAULT_DELIVERY_FEE = 500;

export const ADMIN_COOKIE = "cs_admin";
