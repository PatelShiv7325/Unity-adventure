import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getActivity, getSlots } from "../api/activities";
import { createBooking, validateCoupon } from "../api/bookings";
import { useAuth } from "../context/AuthContext.jsx";
import SlotPicker from "../components/SlotPicker.jsx";
import Stepper from "../components/Stepper.jsx";
import { Skeleton } from "../components/Skeleton.jsx";
import Scene, { sceneFor } from "../components/Scene.jsx";
import { addDaysISO, errMsg, prettyDate, prettyTime, rupees, todayISO } from "../utils/format";

const MAX_PEOPLE = 10;
const phoneOk = (v) => /^\+?\d{10,13}$/.test(v.replace(/[\s\-()]/g, ""));

export default function Booking() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotId, setSlotId] = useState(null);
  const [people, setPeople] = useState(1);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [coupon, setCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState(null); // {code, percent_off}
  const [couponMsg, setCouponMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getActivity(slug).then(setActivity).catch(() => setLoadError("We could not find this ride."));
  }, [slug]);

  useEffect(() => {
    setSlotId(null);
    if (!date) { setSlots([]); return; }
    setSlotsLoading(true);
    getSlots(slug, date).then(setSlots).catch(() => setSlots([])).finally(() => setSlotsLoading(false));
  }, [slug, date]);

  const quickDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(i + 1)), []);
  const chosenSlot = slots.find((s) => s.id === slotId);
  const subtotal = activity ? activity.price * people : 0;
  const discount = couponInfo ? Math.round((subtotal * couponInfo.percent_off) / 100) : 0;
  const total = subtotal - discount;
  const maxPeople = Math.max(1, Math.min(MAX_PEOPLE, chosenSlot ? chosenSlot.available : MAX_PEOPLE));

  // coupon is tied to the amount, so clear it if people changes
  useEffect(() => { setCouponInfo(null); setCouponMsg(""); }, [people]);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const r = await validateCoupon(coupon.trim(), subtotal);
      setCouponInfo(r);
      setCouponMsg(`${r.code} applied: ${r.percent_off}% off`);
    } catch (e) {
      setCouponInfo(null);
      setCouponMsg(errMsg(e, "Invalid coupon"));
    }
  };

  const problems = [];
  if (!date) problems.push("Pick a date");
  else if (!slotId) problems.push("Pick a time slot");
  if (!name.trim()) problems.push("Enter the flyer's name");
  if (!phoneOk(phone)) problems.push("Enter a valid 10-digit phone number");
  const ready = problems.length === 0 && !busy;

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const booking = await createBooking({
        slot_id: slotId,
        participants: Number(people),
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        coupon_code: couponInfo ? couponInfo.code : undefined,
      });
      navigate(`/pay/${booking.id}`);
    } catch (e) {
      setError(e.response?.status === 401 ? "Your session expired. Please log in again." : errMsg(e, "Booking failed"));
      setBusy(false);
    }
  };

  if (loadError) return <section className="section narrow"><p className="error">{loadError}</p><button className="btn" onClick={() => navigate("/activities")}>See all rides</button></section>;
  if (!activity) {
    return (
      <section className="section checkout-wrap">
        <Skeleton h={48} w="40%" style={{ marginBottom: 24 }} />
        <Skeleton h={380} r={14} />
      </section>
    );
  }

  const { kind, photo, photoPosition } = sceneFor(activity.slug, activity.image_url);

  return (
    <section className="section checkout-wrap">
      <Stepper current={1} />
      <h1 className="page-title">Book {activity.title}</h1>

      <div className="checkout">
        <div className="panel">
          <div className="form-step">
            <h3><span className="num">1</span> Choose a date</h3>
            <div className="chips">
              {quickDates.map((d) => (
                <button key={d} type="button" className={`chip ${date === d ? "on" : ""}`} onClick={() => setDate(d)}>
                  {new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                </button>
              ))}
            </div>
            <label className="inline-label">Or pick another date
              <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
          </div>

          <div className="form-step">
            <h3><span className="num">2</span> Choose a time</h3>
            {!date && <p className="empty-note">Select a date first.</p>}
            {date && slotsLoading && <div className="slots">{[1, 2, 3, 4].map((i) => <Skeleton key={i} h={58} w={120} r={14} />)}</div>}
            {date && !slotsLoading && <SlotPicker slots={slots} selectedId={slotId} onSelect={setSlotId} />}
          </div>

          <div className="form-step">
            <h3><span className="num">3</span> Who is flying?</h3>
            <div className="form-grid">
              <label>Name of the person flying
                <input value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
              </label>
              <label>Phone number
                <input value={phone} inputMode="tel" autoComplete="tel" placeholder="10-digit mobile" onChange={(e) => setPhone(e.target.value)} />
                {phone && !phoneOk(phone) && <span className="field-error">Enter a valid 10-digit number</span>}
              </label>
              <label>People
                <div className="stepper-input">
                  <button type="button" aria-label="Fewer people" disabled={people <= 1} onClick={() => setPeople((p) => Math.max(1, Number(p) - 1))}>&minus;</button>
                  <output>{people}</output>
                  <button type="button" aria-label="More people" disabled={people >= maxPeople} onClick={() => setPeople((p) => Math.min(maxPeople, Number(p) + 1))}>+</button>
                </div>
              </label>
            </div>
            <p className="muted small">Weight limit 15&ndash;100 kg per flyer. Minors need a guardian's consent on the day.</p>
          </div>

          <div className="form-step">
            <h3><span className="num">4</span> Have a coupon?</h3>
            <div className="coupon-row">
              <input value={coupon} placeholder="Enter code" onChange={(e) => setCoupon(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} />
              <button type="button" className="btn btn-outline" onClick={applyCoupon} disabled={!coupon.trim()}>Apply</button>
            </div>
            {couponMsg && <p className={couponInfo ? "field-ok" : "field-error"}>{couponMsg}</p>}
          </div>
        </div>

        <aside className="summary">
          <div className="summary-media">
            <Scene kind={kind} photo={photo} photoPosition={photoPosition} />
          </div>
          <div className="summary-body">
            <h3>{activity.title}</h3>
            <p className="muted">{activity.location}</p>
            <dl className="summary-list">
              <div><dt>Date</dt><dd>{date ? prettyDate(date) : "—"}</dd></div>
              <div><dt>Time</dt><dd>{chosenSlot ? prettyTime(chosenSlot.time) : "—"}</dd></div>
              <div><dt>People</dt><dd>{people}</dd></div>
              <div><dt>{rupees(activity.price)} &times; {people}</dt><dd>{rupees(subtotal)}</dd></div>
              {discount > 0 && <div className="discount"><dt>Coupon ({couponInfo.code})</dt><dd>&minus; {rupees(discount)}</dd></div>}
            </dl>
            <div className="summary-total"><span>Total</span><strong>{rupees(total)}</strong></div>
            {error && <p className="error">{error}</p>}
            {error.includes("session") && <button className="btn btn-outline btn-block" onClick={() => navigate("/login")}>Log in again</button>}
            {!ready && !busy && problems.length > 0 && <p className="muted small">{problems[0]}</p>}
            <button className={`btn btn-lg btn-block${busy ? " loading" : ""}`} disabled={!ready} onClick={submit}>
              {busy ? "Reserving your seats…" : "Continue to payment"}
            </button>
            <p className="muted small center">Seats are held for 30 minutes while you pay.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}