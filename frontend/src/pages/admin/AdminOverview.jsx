import { useEffect, useState } from "react";
import { getOverview } from "../../api/admin";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getOverview().then(setData).catch(() => setError("Could not load dashboard summary."));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading...</p>;

  const cards = [
    { label: "Total Activities", value: data.total_activities },
    { label: "Today's Bookings", value: data.todays_bookings },
    { label: "Revenue This Month", value: `₹${data.revenue_this_month.toLocaleString("en-IN")}` },
    { label: "Pending Bookings", value: data.pending_bookings },
  ];

  return (
    <div className="admin-stats">
      {cards.map((c) => (
        <div key={c.label} className="admin-stat-card">
          <div className="admin-stat-value">{c.value}</div>
          <div className="admin-stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
}