import { useEffect, useState } from "react";
import { getAllBookings, updateBookingStatus, refundBooking } from "../../api/admin";

const STATUS_LABEL = { pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", completed: "Completed" };

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  const load = () => getAllBookings().then(setBookings).catch(() => setError("Could not load bookings."));
  useEffect(() => { load(); }, []);

  const setStatus = (id, status) => updateBookingStatus(id, status).then(load).catch((err) =>
    setError(err.response?.data?.error || "Could not update booking.")
  );

  const doRefund = (id) => refundBooking(id).then(load).catch((err) =>
    setError(err.response?.data?.error || "Could not process refund.")
  );

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Booking</th><th>Customer</th><th>Activity</th><th>Date / Time</th>
            <th>Payment</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td>#{b.id}<div className="muted">{b.ticket_code}</div></td>
              <td>{b.customer_name}<div className="muted">{b.customer_phone}</div></td>
              <td>{b.activity}</td>
              <td>{b.date} at {b.time}</td>
              <td>{b.payment_status.replace("_", " ")}</td>
              <td>
                <span className={`admin-badge ${b.status === "cancelled" ? "admin-badge-off" : "admin-badge-on"}`}>
                  {STATUS_LABEL[b.status] || b.status}
                </span>
              </td>
              <td className="admin-actions">
                {b.status === "pending" && (
                  <button className="btn btn-small btn-outline" onClick={() => setStatus(b.id, "confirmed")}>Approve</button>
                )}
                {b.status !== "cancelled" && b.status !== "completed" && (
                  <button className="btn btn-small btn-outline" onClick={() => setStatus(b.id, "cancelled")}>Cancel</button>
                )}
                {b.status === "confirmed" && (
                  <button className="btn btn-small btn-outline" onClick={() => setStatus(b.id, "completed")}>Mark completed</button>
                )}
                {(b.payment_status === "paid" || b.payment_status === "refund_pending") && (
                  <button className="btn btn-small btn-outline" onClick={() => doRefund(b.id)}>Refund</button>
                )}
              </td>
            </tr>
          ))}
          {!bookings.length && <tr><td colSpan="7" className="muted">No bookings yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}