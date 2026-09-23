import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBooking } from "../api/bookings";
import { createOrder, demoConfirm, verifyPayment, upiVerify } from "../api/payments";

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

export default function Pay() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [mode, setMode] = useState(null); // "demo" | "razorpay" | "upi" once the order exists
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" | "upi"
  const [upiData, setUpiData] = useState(null);

  useEffect(() => { getBooking(bookingId).then(setBooking).catch(() => setError("Booking not found")); }, [bookingId]);

  const pay = async () => {
    setError("");
    setBusy(true);
    try {
      const order = await createOrder(booking.id, paymentMethod);
      setMode(order.mode);
      
      if (order.mode === "upi") {
        setUpiData({
          ...order,
          upi_id: "7984438055@ybl",
          transaction_id: order.transaction_id,
          qr_image: "/images/Upi Scanner.jpg"
        });
        setBusy(false);
        return;
      }
      
      if (order.mode === "demo") {
        await demoConfirm(booking.id);
        navigate("/dashboard");
        return;
      }
      
      await loadRazorpay();
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "Unity Adventure Sports",
        description: booking.activity,
        prefill: { name: booking.customer_name, contact: booking.customer_phone, email: booking.customer_email },
        handler: async (resp) => {
          try {
            await verifyPayment({ booking_id: booking.id, ...resp });
            navigate("/dashboard");
          } catch {
            setError("Payment could not be verified. If money was deducted, contact us with your ticket code.");
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Payment failed");
      setBusy(false);
    }
  };

  const confirmUpiPayment = async () => {
    setError("");
    setBusy(true);
    try {
      await upiVerify({ booking_id: booking.id, order_id: upiData.order_id, transaction_id: upiData.transaction_id });
      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.error || "UPI payment verification failed");
      setBusy(false);
    }
  };

  if (error && !booking) return <section className="section narrow"><p className="error">{error}</p></section>;
  if (!booking) return <section className="section narrow"><p>Loading...</p></section>;
  if (booking.payment_status === "paid") {
    return <section className="section narrow"><h1>Already paid</h1><p>Ticket {booking.ticket_code}</p></section>;
  }

  return (
    <section className="section narrow">
      <h1>Payment</h1>
      <p><strong>{booking.activity}</strong></p>
      <p className="muted">{booking.date} at {booking.time} &middot; {booking.participants} person(s)</p>
      <p className="muted">{booking.customer_name} &middot; {booking.customer_phone}</p>
      <p className="price">&#8377;{booking.amount}</p>
      
      {error && <p className="error">{error}</p>}
      
      {!upiData && (
        <>
          <div className="payment-methods">
            <label>
              <input 
                type="radio" 
                value="card" 
                checked={paymentMethod === "card"} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
              />
              Card / Netbanking
            </label>
            <label>
              <input 
                type="radio" 
                value="upi" 
                checked={paymentMethod === "upi"} 
                onChange={(e) => setPaymentMethod(e.target.value)} 
              />
              UPI (Scan QR Code)
            </label>
          </div>
          <button className="btn" disabled={busy} onClick={pay}>
            {busy ? "Please wait..." : `Pay \u20B9${booking.amount}`}
          </button>
          {mode === "demo" && <p className="muted">Demo mode: no real money is charged.</p>}
        </>
      )}
      
      {upiData && (
        <div className="upi-payment">
          <h2>Scan to Pay</h2>
          <div className="qr-container">
            <img src={upiData.qr_image} alt="UPI QR Code" className="qr-code" />
          </div>
          <p className="muted">Amount: &#8377;{booking.amount}</p>
          <p className="muted">UPI ID: {upiData.upi_id}</p>
          <p className="muted">Transaction ID: {upiData.transaction_id}</p>
          <button className="btn" disabled={busy} onClick={confirmUpiPayment}>
            {busy ? "Verifying..." : "I have completed the payment"}
          </button>
          <button className="btn btn-outline" onClick={() => setUpiData(null)}>
            Change payment method
          </button>
        </div>
      )}
    </section>
  );
}
