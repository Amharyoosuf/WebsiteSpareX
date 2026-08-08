import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

const styles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export function StatusBadge({ status }: { status: string }) {
  const key = (status as OrderStatus) in styles ? (status as OrderStatus) : "PENDING";
  return <span className={`badge ${styles[key]}`}>{ORDER_STATUS_LABELS[key]}</span>;
}
