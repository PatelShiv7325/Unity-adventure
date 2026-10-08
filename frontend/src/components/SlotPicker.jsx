import { prettyTime } from "../utils/format";

export default function SlotPicker({ slots, selectedId, onSelect }) {
  if (!slots.length) return <p className="empty-note">No slots on this date. Try another day.</p>;
  return (
    <div className="slots" role="radiogroup" aria-label="Time slot">
      {slots.map((s) => {
        const soldOut = s.available <= 0;
        const low = !soldOut && s.available <= 2;
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={selectedId === s.id}
            disabled={soldOut}
            className={`slot ${selectedId === s.id ? "selected" : ""}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="slot-time">{prettyTime(s.time)}</span>
            <small className={low ? "slot-low" : ""}>{soldOut ? "Sold out" : low ? `Only ${s.available} left` : `${s.available} seats`}</small>
          </button>
        );
      })}
    </div>
  );
}