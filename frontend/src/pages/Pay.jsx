import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getBooking } from "../api/bookings";
import { createOrder, demoConfirm, getPayConfig, upiSubmit, verifyPayment } from "../api/payments";
import Stepper from "../components/Stepper.jsx";
import TicketModal from "../components/TicketModal.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { saveTicketFile } from "../utils/download";
import { errMsg, prettyDate, prettyTime, rupees } from "../utils/format";

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Could not load Razorpay"));
    document.body.appendChild(s);
  });
}

// server sends naive UTC timestamps
const toMs = (iso) => new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();

function HoldTimer({ createdAt, minutes, onExpire }) {
  const [left, setLeft] = useState(() => toMs(createdAt) + minutes * 60000 - Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const v = toMs(createdAt) + minutes * 60000 - Date.now();
      setLeft(v);
      if (v <= 0) { clearInterval(t); onExpire(); }
    }, 1000);
    return () => clearInterval(t);
  }, [createdAt, minutes, onExpire]);
  const s = Math.max(0, Math.floor(left / 1000));
  return (
    <p className={`hold-timer${s < 300 ? " urgent" : ""}`}>
      Seats held for <strong>{String(Math.floor(s / 60)).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</strong>
    </p>
  );
}

function Summary({ booking }) {
  return (
    <aside className="summary">
      <div className="summary-body">
        <h3>{booking.activity}</h3>
        <dl className="summary-list">
          <div><dt>Date</dt><dd>{prettyDate(booking.date)}</dd></div>
          <div><dt>Time</dt><dd>{prettyTime(booking.time)}</dd></div>
          <div><dt>People</dt><dd>{booking.participants}</dd></div>
          <div><dt>Flyer</dt><dd>{booking.customer_name}</dd></div>
          <div><dt>Phone</dt><dd>{booking.customer_phone}</dd></div>
          {booking.discount > 0 && <div className="discount"><dt>Coupon saving</dt><dd>&minus; {rupees(booking.discount)}</dd></div>}
        </dl>
        <div className="summary-total"><span>Total</span><strong>{rupees(booking.amount)}</strong></div>
      </div>
    </aside>
  );
}

export default function Pay() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [method, setMethod] = useState("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [upi, setUpi] = useState(null);        // order details while the QR is showing
  const [utr, setUtr] = useState("");
  const [showStatic, setShowStatic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [expired, setExpired] = useState(false);
  const pollRef = useRef(null);

  const refresh = useCallback(() => getBooking(bookingId).then(setBooking), [bookingId]);

  useEffect(() => {
    refresh().catch(() => setError("Booking not found"));
    getPayConfig().then(setCfg).catch(() => setCfg({ upi: true, razorpay: false, demo: false, hold_minutes: 30 }));
  }, [refresh]);

  // while the admin is verifying the UPI payment, check every 8 seconds
  useEffect(() => {
    if (booking?.payment_status !== "verifying") return;
    pollRef.current = setInterval(() => refresh().catch(() => {}), 8000);
    return () => clearInterval(pollRef.current);
  }, [booking?.payment_status, refresh]);

  useEffect(() => {
    if (cfg && !cfg.upi && method === "upi") setMethod(cfg.razorpay || cfg.demo ? "card" : "upi");
  }, [cfg, method]);

  const startUpi = async () => {
    setError(""); setBusy(true);
    try {
      setUpi(await createOrder(booking.id, "upi"));
    } catch (e) { setError(errMsg(e, "Could not start the UPI payment")); }
    setBusy(false);
  };

  const startCard = async () => {
    setError(""); setBusy(true);
    try {
      const order = await createOrder(booking.id, "card");
      if (order.mode === "demo") {
        await demoConfirm(booking.id);
        await refresh();
        setBusy(false);
        return;
      }
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.order_id,
        name: "Unity Adventure Sports", description: booking.activity,
        prefill: { name: booking.customer_name, contact: booking.customer_phone, email: booking.customer_email },
        theme: { color: "#ff5a1f" },
        handler: async (resp) => {
          try { await verifyPayment({ booking_id: booking.id, ...resp }); await refresh(); }
          catch { setError("Payment could not be verified. If money was deducted, contact us with your ticket code."); }
          setBusy(false);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) { setError(errMsg(e, "Payment failed")); setBusy(false); }
  };

  const submitUtr = async () => {
    setError(""); setBusy(true);
    try {
      const b = await upiSubmit({ booking_id: booking.id, order_id: upi.order_id, utr: utr.trim() });
      setBooking(b);
      setUpi(null);
      toast.info(b.payment_status === "paid" ? "Payment confirmed" : "Payment submitted for verification");
    } catch (e) { setError(errMsg(e, "Could not submit the payment reference")); }
    setBusy(false);
  };

  const copyUpi = async () => {
    try { await navigator.clipboard.writeText(upi.upi_id); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error("Copy failed. Please copy the UPI ID manually."); }
  };

  const download = async () => {
    try { await saveTicketFile(booking); toast.success("Ticket downloaded"); }
    catch (e) { toast.error(errMsg(e, "Download failed")); }
  };

  if (error && !booking) return <section className="section narrow"><p className="error">{error}</p><Link className="btn" to="/dashboard">My bookings</Link></section>;
  if (!booking || !cfg) return <section className="section checkout-wrap"><Skeleton h={50} w="40%" style={{ marginBottom: 20 }} /><Skeleton h={340} r={14} /></section>;

  const paid = booking.payment_status === "paid";
  const verifying = booking.payment_status === "verifying";
  const cancelled = booking.status === "cancelled" || expired;
  const hasCard = cfg.razorpay || cfg.demo;

  // ---------- Success ----------
  if (paid && !cancelled) {
    return (
      <section className="section checkout-wrap">
        <Stepper current={3} />
        <div className="success-card">
          <svg className="success-check" viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" fill="none" />
            <path d="M14 27 l8 8 l16 -17" fill="none" />
          </svg>
          <h1>Payment successful</h1>
          <p className="muted">Your booking is confirmed. A copy of the ticket is sent to your email if one is on file.</p>
          <div className="success-meta">
            <div><span>Activity</span><strong>{booking.activity}</strong></div>
            <div><span>When</span><strong>{prettyDate(booking.date)}, {prettyTime(booking.time)}</strong></div>
            <div><span>Ticket code</span><strong className="code">{booking.ticket_code}</strong></div>
          </div>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <button className="btn btn-lg" onClick={download}>Download ticket</button>
            <button className="btn btn-outline btn-lg" onClick={() => setTicketOpen(true)}>View ticket</button>
          </div>
          <p className="muted small">Arrive 20 minutes early with a photo ID. <Link to="/dashboard">Go to My bookings</Link></p>
        </div>
        <TicketModal booking={ticketOpen ? booking : null} onClose={() => setTicketOpen(false)} />
      </section>
    );
  }

  // ---------- Cancelled / expired ----------
  if (cancelled) {
    return (
      <section className="section narrow center">
        <h1>Booking expired</h1>
        <p className="muted">This booking was cancelled or the seat hold ran out. No money was taken.</p>
        <button className="btn" onClick={() => navigate(`/book/${booking.activity_slug}`)}>Book again</button>
      </section>
    );
  }

  // ---------- Waiting for admin to verify the UPI payment ----------
  if (verifying) {
    return (
      <section className="section checkout-wrap">
        <Stepper current={2} />
        <div className="success-card pending">
          <div className="spinner" aria-hidden="true" />
          <h1>Verifying your payment</h1>
          <p className="muted">
            We received your UPI reference <strong>{booking.payment_ref}</strong>. Once we see the money in our account
            your ticket unlocks here automatically. This usually takes a few minutes.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <button className="btn btn-outline" onClick={() => refresh()}>Check status now</button>
            <Link className="btn btn-outline" to="/dashboard">My bookings</Link>
          </div>
          <p className="muted small">Need help? Call +91 90814 24343 with ticket code {booking.ticket_code}.</p>
        </div>
      </section>
    );
  }

  // ---------- Choose method / pay ----------
  return (
    <section className="section checkout-wrap">
      <Stepper current={2} />
      <h1 className="page-title">Payment</h1>
      <div className="checkout">
        <div className="panel">
          {cfg.hold_minutes && <HoldTimer createdAt={booking.created_at} minutes={cfg.hold_minutes} onExpire={() => setExpired(true)} />}
          {error && <p className="error" role="alert">{error}</p>}

          {!upi && (
            <>
              <div className="method-tabs" role="tablist">
                {cfg.upi && (
                  <button role="tab" aria-selected={method === "upi"} className={`method${method === "upi" ? " on" : ""}`} onClick={() => setMethod("upi")}>
                    <strong>UPI</strong><span>Scan QR / GPay, PhonePe, Paytm</span>
                  </button>
                )}
                {hasCard && (
                  <button role="tab" aria-selected={method === "card"} className={`method${method === "card" ? " on" : ""}`} onClick={() => setMethod("card")}>
                    <strong>Card / Netbanking</strong><span>{cfg.razorpay ? "Secured by Razorpay" : "Demo mode (no real money)"}</span>
                  </button>
                )}
              </div>
              {method === "upi" && cfg.upi && (
                <button className={`btn btn-lg btn-block${busy ? " loading" : ""}`} disabled={busy} onClick={startUpi}>
                  {busy ? "Please wait…" : `Pay ${rupees(booking.amount)} with UPI`}
                </button>
              )}
              {method === "card" && hasCard && (
                <button className={`btn btn-lg btn-block${busy ? " loading" : ""}`} disabled={busy} onClick={startCard}>
                  {busy ? "Please wait…" : `Pay ${rupees(booking.amount)}`}
                </button>
              )}
              {!cfg.upi && !hasCard && <p className="error">No payment method is available right now. Please call +91 90814 24343.</p>}
            </>
          )}

          {upi && (
            <div className="upi-flow">
              <ol className="upi-steps">
                <li>Scan the QR with any UPI app (amount is filled in), or tap <em>Open UPI app</em> on your phone.</li>
                <li>Pay exactly <strong>{rupees(upi.amount_rupees)}</strong>.</li>
                <li>Enter the 12-digit <strong>UTR / reference number</strong> from the payment screen below.</li>
              </ol>

              <div className="qr-box">
                <img src={showStatic ? upi.static_qr : upi.qr_data_uri} alt="UPI QR code" className="qr-code" />
                <div className="qr-side">
                  <p className="muted small">Paying to</p>
                  <p className="payee">{upi.payee}</p>
                  <button type="button" className="copy-chip" onClick={copyUpi}>
                    {upi.upi_id} <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <a className="btn btn-outline btn-small" href={upi.upi_uri}>Open UPI app</a>
                  <button type="button" className="link-quiet" onClick={() => setShowStatic((v) => !v)}>
                    {showStatic ? "Show amount-filled QR" : "QR not scanning? Use our standard QR"}
                  </button>
                  {showStatic && <p className="muted small">With the standard QR, enter {rupees(upi.amount_rupees)} yourself.</p>}
                </div>
              </div>

              <label>UPI reference number (UTR)
                <input value={utr} inputMode="numeric" maxLength={12} placeholder="12 digits, e.g. 412345678901"
                  onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))} />
                <span className="muted small">Find it in GPay / PhonePe / Paytm under the payment details (called UPI Ref ID, UTR or Transaction ID).</span>
              </label>
              <button className={`btn btn-lg btn-block${busy ? " loading" : ""}`} disabled={busy || utr.length !== 12} onClick={submitUtr}>
                {busy ? "Submitting…" : "I have paid — submit reference"}
              </button>
              <button className="link-quiet" onClick={() => { setUpi(null); setUtr(""); setError(""); }}>Change payment method</button>
            </div>
          )}
        </div>
        <Summary booking={booking} />
      </div>
    </section>
  );
}