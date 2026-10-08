const MAP = {
  pending: ["Awaiting payment", "warn"],
  verifying: ["Payment being verified", "info"],
  confirmed: ["Confirmed", "ok"],
  paid: ["Paid", "ok"],
  completed: ["Completed", "ok"],
  cancelled: ["Cancelled", "bad"],
  failed: ["Payment failed", "bad"],
  refund_pending: ["Refund pending", "warn"],
  refunded: ["Refunded", "muted"],
};

export default function StatusPill({ value, label }) {
  const [text, tone] = MAP[value] || [String(value || "").replace("_", " "), "muted"];
  return <span className={`pill pill-${tone}`}>{label || text}</span>;
}