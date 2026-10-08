import { useEffect, useMemo, useState } from "react";
import { getAllBookings, updateBookingStatus, refundBooking, approvePayment, rejectPayment } from "../../api/admin";
import StatusPill from "../../components/StatusPill.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { errMsg, prettyDate, prettyTime, rupees } from "../../utils/format";

const FILTERS = [["all", "All"], ["verify", "To verify"], ["pending", "Awaiting payment"], ["confirmed", "Confirmed"], ["cancelled", "Cancelled"]];

export default function AdminBookings() {
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () => getAllBookings().then(setBookings).catch(() => setError("Could not load bookings.")).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const act = async (id, fn, okMsg) => {
    setBusyId(id); setError("");
    try { await fn(id); toast.success(okMsg); await load(); }
    catch (e) { setError(errMsg(e, "Action failed")); }
    setBusyId(null);
  };

  const toVerify = bookings.filter((b) => b.payment_status === "verifying").length;
  const rows = useMemo(() => bookings.filter((b) => {
    if (filter === "verify" && b.payment_status !== "verifying") return false;
    if (filter === "pending" && !(b.status === "pending" && b.payment_status !== "verifying")) return false;
    if (filter === "confirmed" && b.status !== "confirmed") return false;
    if (filter === "cancelled" && b.status !== "cancelled") return false;
    const t = q.trim().toLowerCase();
    return !t || [b.customer_name, b.customer_phone, b.ticket_code, b.utr, b.account_email].some((v) => (v || "").toLowerCase().includes(t));
  }), [bookings, filter, q]);

  return (
    <div>
      {toVerify > 0 && (
        <div className="notice notice-info">
          <strong>{toVerify} UPI payment{toVerify > 1 ? "s" : ""} waiting.</strong> Open your UPI/bank app, check the money with the same UTR arrived, then press <em>Approve payment</em>.
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <div className="admin-toolbar">
        <div className="chips">
          {FILTERS.map(([k, label]) => (
            <button key={k} className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
              {label}{k === "verify" && toVerify > 0 ? ` (${toVerify})` : ""}
            </button>
          ))}
        </div>
        <input className="admin-search" placeholder="Search name, phone, ticket, UTR" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>Booking</th><th>Customer</th><th>Activity</th><th>Date / Time</th><th>Amount</th><th>Payment</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className={b.payment_status === "verifying" ? "row-attention" : ""}>
                <td>#{b.id}<div className="muted">{b.ticket_code}</div></td>
                <td>{b.customer_name}<div className="muted">{b.customer_phone}</div></td>
                <td>{b.activity}<div className="muted">{b.participants} person(s)</div></td>
                <td>{prettyDate(b.date)}<div className="muted">{prettyTime(b.time)}</div></td>
                <td>{rupees(b.amount)}</td>
                <td>
                  <StatusPill value={b.payment_status} />
                  {b.utr && <div className="muted">UTR {b.utr}</div>}
                </td>
                <td><StatusPill value={b.status} /></td>
                <td className="admin-actions">
                  {b.payment_status === "verifying" && (
                    <>
                      <button className="btn btn-small" disabled={busyId === b.id} onClick={() => act(b.id, approvePayment, "Payment approved. Ticket unlocked.")}>Approve payment</button>
                      <button className="btn btn-small btn-outline btn-danger" disabled={busyId === b.id} onClick={() => act(b.id, rejectPayment, "Payment rejected")}>Reject</button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button className="btn btn-small btn-outline" disabled={busyId === b.id} onClick={() => act(b.id, (id) => updateBookingStatus(id, "completed"), "Marked completed")}>Mark completed</button>
                  )}
                  {b.status !== "cancelled" && b.status !== "completed" && (
                    <button className="btn btn-small btn-outline btn-danger" disabled={busyId === b.id}
                      onClick={() => window.confirm("Cancel this booking and release the seats?") && act(b.id, (id) => updateBookingStatus(id, "cancelled"), "Booking cancelled")}>Cancel</button>
                  )}
                  {(b.payment_status === "paid" || b.payment_status === "refund_pending") && (
                    <button className="btn btn-small btn-outline" disabled={busyId === b.id}
                      onClick={() => window.confirm("Mark this booking as refunded? Send the money back first.") && act(b.id, refundBooking, "Marked refunded")}>Refunded</button>
                  )}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="8" className="muted">{loading ? "Loading…" : "No bookings match."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}