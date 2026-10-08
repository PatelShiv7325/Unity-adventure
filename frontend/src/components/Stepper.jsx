const STEPS = ["Choose slot", "Payment", "Your ticket"];

export default function Stepper({ current = 1 }) {
  return (
    <ol className="stepper" aria-label="Booking progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "active" : "todo";
        return (
          <li key={label} className={`stepper-item ${state}`} aria-current={state === "active" ? "step" : undefined}>
            <span className="stepper-dot">{state === "done" ? "\u2713" : n}</span>
            <span className="stepper-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}