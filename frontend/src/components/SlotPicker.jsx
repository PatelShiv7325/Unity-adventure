export default function SlotPicker({ slots, selectedId, onSelect }) {
  if (!slots.length) return <p className="muted">No slots available for this date.</p>;
  return (
    <div className="slots">
      {slots.map((s) => (
        <button
          key={s.id}
          disabled={s.available <= 0}
          className={`slot ${selectedId === s.id ? "selected" : ""}`}
          onClick={() => onSelect(s.id)}
        >
          {s.time} <small>({s.available} left)</small>
        </button>
      ))}
    </div>
  );
}
