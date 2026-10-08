import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOverview } from "../../api/admin";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOverview().then(setData).catch(() => setError("Could not load dashboard summary."));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  const cards = [
    { label: "Total Activities", value: data.total_activities },
    { label: "Today's Bookings", value: data.todays_bookings },
    { label: "Revenue This Month", value: `₹${data.revenue_this_month.toLocaleString("en-IN")}` },
    { label: "Pending Bookings", value: data.pending_bookings },
    { label: "UPI Payments To Verify", value: data.payments_to_verify ?? 0, link: "/admin/bookings", hot: (data.payments_to_verify ?? 0) > 0 },
  ];

  return (
    <div className="admin-stats">
      {cards.map((c) => {
        const inner = (
          <>
            <div className="admin-stat-value">{c.value}</div>
            <div className="admin-stat-label">{c.label}</div>
          </>
        );
        return c.link
          ? <Link key={c.label} to={c.link} className={`admin-stat-card admin-stat-link${c.hot ? " hot" : ""}`}>{inner}</Link>
          : <div key={c.label} className="admin-stat-card">{inner}</div>;
      })}
    </div>
  );
}