import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, cancelBooking, downloadTicket } from "../api/bookings";

const LABELS = {
  pending: "Waiting for payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const load = () => getMyBookings().then(setBookings);
  useEffect(() => { load(); }, []);

    const saveTicket = async (b) => {
    const blob = await downloadTicket(b.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${b.ticket_code}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="section">
      <h1 className="section-heading-orange">My bookings</h1>
      {!bookings.length && <p className="muted">No bookings yet. Pick an activity to get started.</p>}
      {bookings.map((b) => (
        <div key={b.id} className="row">
          <div>
            <strong>{b.activity}</strong>
            <div className="muted">{b.date} at {b.time} &middot; {b.participants} person(s) &middot; &#8377;{b.amount}</div>
            <div className="muted">{b.customer_name} &middot; {b.customer_phone}</div>
            <div className="muted">
              Ticket {b.ticket_code} &middot; {LABELS[b.status] || b.status} &middot; Payment: {b.payment_status.replace("_", " ")}
            </div>
          </div>
          <div>
            {b.status === "pending" && <Link to={`/pay/${b.id}`} className="btn btn-small">Pay now</Link>}{" "}
            {(b.status === "pending" || b.status === "confirmed") && (
              <button className="btn btn-small btn-outline" onClick={() => cancelBooking(b.id).then(load)}>Cancel</button>
            )}
            {b.payment_status === "paid" && (
              <button className="btn btn-small btn-outline" onClick={() => saveTicket(b)}>Download ticket</button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
