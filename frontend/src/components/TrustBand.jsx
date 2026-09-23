const STATS = [
  { n: "750+", l: "flying Hrs Experience" },
  { n: "15+", l: "years experience" },
  { n: "5400+", l: "Kilometers cross country flying experience" },
  { n: "1,500+", l: "Student Trained" },
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
