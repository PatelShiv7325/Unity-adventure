import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getActivity, getSlots } from "../api/activities";
import { createBooking } from "../api/bookings";
import { useAuth } from "../context/AuthContext.jsx";
import SlotPicker from "../components/SlotPicker.jsx";

export default function Booking() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState(null);
  const [people, setPeople] = useState(1);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [error, setError] = useState("");

  useEffect(() => { getActivity(slug).then(setActivity); }, [slug]);
  useEffect(() => {
    setSlotId(null);
    if (date) getSlots(slug, date).then(setSlots);
  }, [slug, date]);

  const submit = async () => {
    setError("");
    try {
      const booking = await createBooking({
        slot_id: slotId,
        participants: Number(people),
        customer_name: name,
        customer_phone: phone,
      });
      navigate(`/pay/${booking.id}`);
    } catch (e) {
      if (e.response?.status === 401) {
        setError("Your session is invalid. Please log in again.");
      } else {
        setError(e.response?.data?.error || "Booking failed");
      }
    }
  };

  if (!user) {
    return (
      <section className="section narrow">
        <h1>Authentication Required</h1>
        <p className="error">You need to be logged in to book a ride.</p>
        <button className="btn" onClick={() => navigate("/login")}>Log in</button>
      </section>
    );
  }

  if (!activity) return <section className="section"><p>Loading...</p></section>;
  const ready = slotId && name.trim() && phone.trim();
  return (
    <section className="section narrow">
      <h1>Book {activity.title}</h1>
      <label>Date <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      {date && <SlotPicker slots={slots} selectedId={slotId} onSelect={setSlotId} />}
      <label>People <input type="number" min="1" max="6" value={people} onChange={(e) => setPeople(e.target.value)} /></label>
      <label>Name of the person flying <input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Phone number <input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <p className="price">Total: &#8377;{activity.price * people}</p>
      {error && <p className="error">{error}</p>}
      {error && error.includes("session is invalid") && (
        <button className="btn btn-outline" onClick={() => navigate("/login")}>Log in again</button>
      )}
      <button className="btn" disabled={!ready} onClick={submit}>Continue to payment</button>
    </section>
  );
}
