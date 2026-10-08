import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking } from "../api/bookings";
import StatusPill from "../components/StatusPill.jsx";
import TicketModal from "../components/TicketModal.jsx";
import Modal from "../components/Modal.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { saveTicketFile } from "../utils/download";
import { errMsg, prettyDate, prettyTime, rupees, todayISO } from "../utils/format";

const FILTERS = [
  ["all", "All"],
  ["upcoming", "Upcoming"],
  ["unpaid", "Needs payment"],
  ["past", "Past & cancelled"],
];

export default function Dashboard() {
  const toast = useToast();
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [ticket, setTicket] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = () => getMyBookings().then(setBookings).catch((e) => setError(errMsg(e, "Could not load your bookings")));
  useEffect(() => { load(); }, []);

  const today = todayISO();
  const shown = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b) => {
      const dead = b.status === "cancelled" || b.status === "completed" || b.date < today;
      if (filter === "upcoming") return !dead && b.payment_status === "paid";
      if (filter === "unpaid") return b.status === "pending" && ["pending", "failed", "verifying"].includes(b.payment_status);
      if (filter === "past") return dead;
      return true;
    });
  }, [bookings, filter, today]);

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(toCancel.id);
      toast.success("Booking cancelled");
      setToCancel(null);
      await load();
    } catch (e) { toast.error(errMsg(e, "Could not cancel")); }
    setCancelling(false);
  };

  const download = async (b) => {
    try { await saveTicketFile(b); toast.success("Ticket downloaded"); }
    catch (e) { toast.error(errMsg(e, "Download failed")); }
  };

  return (
    <section className="section">
      <div className="page-head">
        <h1 className="section-heading-orange">My bookings</h1>
        <Link to="/activities" className="btn">Book a ride</Link>
      </div>

      <div className="chips" role="tablist" aria-label="Filter bookings">
        {FILTERS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={filter === k} className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>{label}</button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {!bookings && !error && [1, 2, 3].map((i) => <Skeleton key={i} h={118} r={14} style={{ marginBottom: 14 }} />)}

      {bookings && !shown.length && (
        <div className="empty-state">
          <h3>{bookings.length ? "Nothing in this view" : "No bookings yet"}</h3>
          <p className="muted">{bookings.length ? "Try another filter." : "Pick a ride and choose your slot to get started."}</p>
          {!bookings.length && <Link className="btn" to="/activities">See all rides</Link>}
        </div>
      )}

      {shown.map((b) => {
        const open = b.status === "pending" || b.status === "confirmed";
        return (
          <article key={b.id} className="booking-card">
            <div className="booking-main">
              <div className="booking-top">
                <strong className="booking-title">{b.activity}</strong>
                <StatusPill value={b.status === "confirmed" || b.status === "completed" || b.status === "cancelled" ? b.status : b.payment_status === "verifying" ? "verifying" : "pending"} />
              </div>
              <div className="booking-meta">
                <span>{prettyDate(b.date)} &middot; {prettyTime(b.time)}</span>
                <span>{b.participants} person(s)</span>
                <span>{rupees(b.amount)}</span>
              </div>
              <div className="booking-meta muted">
                <span>{b.customer_name} &middot; {b.customer_phone}</span>
                <span>Ticket <b className="code">{b.ticket_code}</b></span>
                {["refund_pending", "refunded", "failed"].includes(b.payment_status) && <StatusPill value={b.payment_status} />}
              </div>
            </div>
            <div className="booking-actions">
              {b.status === "pending" && b.payment_status !== "paid" && (
                <Link to={`/pay/${b.id}`} className="btn btn-small">{b.payment_status === "verifying" ? "Check payment" : "Pay now"}</Link>
              )}
              {b.payment_status === "paid" && b.status !== "cancelled" && (
                <>
                  <button className="btn btn-small" onClick={() => setTicket(b)}>View ticket</button>
                  <button className="btn btn-small btn-outline" onClick={() => download(b)}>Download</button>
                </>
              )}
              {open && <button className="btn btn-small btn-outline btn-danger" onClick={() => setToCancel(b)}>Cancel</button>}
            </div>
          </article>
        );
      })}

      <TicketModal booking={ticket} onClose={() => setTicket(null)} />
      <Modal open={!!toCancel} onClose={() => !cancelling && setToCancel(null)} title="Cancel this booking?">
        {toCancel && (
          <>
            <p>{toCancel.activity} &middot; {prettyDate(toCancel.date)} at {prettyTime(toCancel.time)}</p>
            {toCancel.payment_status === "paid" || toCancel.payment_status === "verifying"
              ? <p className="muted">You have already paid. Your refund will be processed by our team after cancellation.</p>
              : <p className="muted">Your held seats will be released.</p>}
            <div className="modal-actions">
              <button className="btn btn-outline" disabled={cancelling} onClick={() => setToCancel(null)}>Keep booking</button>
              <button className="btn btn-danger-solid" disabled={cancelling} onClick={confirmCancel}>{cancelling ? "Cancelling…" : "Yes, cancel"}</button>
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}