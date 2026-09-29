const STATS = [
  { n: "15+", l: "Years experience" },
  { n: "805+", l: "Flying Hrs Experience" },
  { n: "1,500+", l: "Student Trained" },
  { n: "5400+", l: "Kilometers cross country flying experience" },
];

export default function TrustBand() {
  return (
    <section className="trust">
      <div className="trust-inner">
        {STATS.map((s) => (
          <div key={s.l}>
            <strong>{s.n}</strong>
            <span>{s.l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
